import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
if (!credentials) {
  console.log("FIREBASE_SERVICE_ACCOUNT saknas; inget videojobb behandlas.");
  process.exit(0);
}

initializeApp({ credential: cert(credentials) });
const db = getFirestore();

function capture(command, args) {
  return new Promise((resolve, reject) => {
    let output = "";
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });
    child.stdout.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve(output) : reject(new Error(`${command} avslutades med kod ${code}`)),
    );
  });
}

const jobCandidates = await db
  .collection("videoJobs")
  .where("status", "in", ["pending", "failed", "processing"])
  .get();
let jobDocument;
let job;
let chunks;
const newestFirst = [...jobCandidates.docs].sort((a, b) => {
  const aTime = a.data().createdAt?.toMillis?.() ?? 0;
  const bTime = b.data().createdAt?.toMillis?.() ?? 0;
  return bTime - aTime;
});
for (const candidate of newestFirst) {
  const candidateJob = candidate.data();
  if ((candidateJob.attempts ?? 0) >= 3 || !candidateJob.presentationId) continue;
  const candidateChunks = await db
    .collection("presentations")
    .doc(candidateJob.presentationId)
    .collection("chunks")
    .orderBy("index")
    .get();
  if (candidateChunks.empty) {
    await candidate.ref.update({
      status: "failed",
      progress: 100,
      completedAt: Timestamp.now(),
      error: "Den uppladdade videon saknar databitar",
    });
    console.log(`Hoppar över ett gammalt videjobb utan databitar (${candidate.id}).`);
    continue;
  }
  jobDocument = candidate;
  job = candidateJob;
  chunks = candidateChunks;
  break;
}

if (!jobDocument) {
  console.log("Inget väntande videojobb.");
  process.exit(0);
}

const jobRef = jobDocument.ref;
const presentationId = job.presentationId;
if (!presentationId) throw new Error("Videojobbet saknar presentationId");

await jobRef.update({
  status: "processing",
  progress: 40,
  attempts: (job.attempts ?? 0) + 1,
  startedAt: Timestamp.now(),
});

const workDir = join(tmpdir(), `sdesk-video-${jobDocument.id}`);
const inputPath = join(workDir, "input.mp4");
const outputPath = join(workDir, "output.mp4");

try {
  await mkdir(workDir, { recursive: true });
  const input = Buffer.concat(
    chunks.docs.map((chunk) => {
      const data = chunk.data().data;
      return Buffer.from(
        typeof data?.toUint8Array === "function" ? data.toUint8Array() : data,
      );
    }),
  );
  await writeFile(inputPath, input);

  const duration = Number(
    await capture("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inputPath,
    ]),
  );

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-progress", "pipe:1",
      "-nostats",
      "-map", "0:v:0",
      "-an",
      "-c:v", "libx264",
      "-profile:v", "high",
      "-level:v", "5.1",
      "-pix_fmt", "yuv420p",
      "-vf", "scale=2880:2160:force_original_aspect_ratio=decrease,pad=2880:2160:(ow-iw)/2:(oh-ih)/2:black",
      "-r", "30",
      "-preset", "medium",
      "-crf", "18",
      "-maxrate", "35M",
      "-bufsize", "70M",
      "-movflags", "+faststart",
      outputPath,
    ], { stdio: ["ignore", "pipe", "inherit"] });
    let progressOutput = "";
    let lastProgress = 40;
    ffmpeg.stdout.on("data", (chunk) => {
      progressOutput += chunk.toString();
      const lines = progressOutput.split("\n");
      progressOutput = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("out_time_ms=") || !duration) continue;
        const seconds = Number(line.slice("out_time_ms=".length)) / 1_000_000;
        const progress = Math.min(90, 40 + Math.floor((seconds / duration) * 50));
        if (progress >= lastProgress + 2) {
          lastProgress = progress;
          void jobRef.update({ progress });
        }
      }
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`FFmpeg avslutades med kod ${code}`)),
    );
  });

  const output = await readFile(outputPath);
  await writeFile("public/media/infoskarmen-production.mp4", output);
  await writeFile(
    "src/generatedVideoVersion.ts",
    `export const VIDEO_VERSION = ${JSON.stringify(new Date().toISOString())};\n`,
  );
  await jobRef.update({
    status: "publishing",
    progress: 95,
    outputSize: output.byteLength,
  });
  if (process.env.GITHUB_OUTPUT)
    await writeFile(process.env.GITHUB_OUTPUT, `job_id=${jobDocument.id}\n`, { flag: "a" });
  console.log(`Videon är färdigkodad (${output.byteLength} byte).`);
} catch (error) {
  await jobRef.update({
    status: "failed",
    progress: 100,
    completedAt: Timestamp.now(),
    error: error instanceof Error ? error.message.slice(0, 500) : "Okänt fel",
  });
  throw error;
}
