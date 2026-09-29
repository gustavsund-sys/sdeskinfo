import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
const jobId = process.env.VIDEO_JOB_ID;
if (!credentials || !jobId) process.exit(0);

initializeApp({ credential: cert(credentials) });
const db = getFirestore();
const jobRef = db.collection("videoJobs").doc(jobId);
const jobSnapshot = await jobRef.get();
const presentationId = jobSnapshot.data()?.presentationId;
const publishedAt = new Date().toISOString();

const batch = db.batch();
batch.update(jobRef, {
  status: "ready",
  progress: 100,
  completedAt: Timestamp.now(),
});
batch.set(
  db.collection("settings").doc("display"),
  { videoVersion: publishedAt },
  { merge: true },
);
await batch.commit();

if (presentationId) {
  const presentationRef = db.collection("presentations").doc(presentationId);
  const chunks = await presentationRef.collection("chunks").get();
  for (let start = 0; start < chunks.docs.length; start += 400) {
    const batch = db.batch();
    for (const chunk of chunks.docs.slice(start, start + 400)) batch.delete(chunk.ref);
    await batch.commit();
  }
  await presentationRef.delete();
}
console.log(`Videojobbet ${jobId} är publicerat.`);
