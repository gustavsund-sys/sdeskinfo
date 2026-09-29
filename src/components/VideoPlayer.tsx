import { useEffect, useRef, useState } from "react";
import {
  Bytes,
  collection,
  documentId,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

export function VideoPlayer({
  presentationId,
  sourceUrl,
}: {
  presentationId?: string;
  sourceUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState("");
  const [nextSource, setNextSource] = useState("");
  const [nextReady, setNextReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setFailed(false);

    async function load() {
      try {
        if (sourceUrl) {
          setSource((current) => {
            if (!current) return sourceUrl;
            if (current !== sourceUrl) {
              setNextReady(false);
              setNextSource(sourceUrl);
            }
            return current;
          });
          return;
        }
        if (!presentationId) throw new Error("Videon saknas");
        const snap = await getDocs(
          query(
            collection(db, "presentations", presentationId, "chunks"),
            orderBy(documentId()),
          ),
        );
        if (cancelled || snap.empty) throw new Error("Videon saknas");
        const parts = snap.docs.map((item) =>
          (item.data().data as Bytes).toUint8Array(),
        );
        const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
        const merged = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) {
          merged.set(part, offset);
          offset += part.byteLength;
        }
        objectUrl = URL.createObjectURL(
          new Blob([merged.buffer], { type: "video/mp4" }),
        );
        if (!cancelled) setSource(objectUrl);
      } catch (error) {
        if (!cancelled) {
          console.error("Kunde inte läsa presentationsfilmen", error);
          setFailed(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [presentationId, sourceUrl]);

  useEffect(() => {
    if (!nextReady || !nextSource) return;
    const id = window.setTimeout(() => {
      setSource(nextSource);
      setNextSource("");
      setNextReady(false);
    }, 450);
    return () => window.clearTimeout(id);
  }, [nextReady, nextSource]);

  return (
    <div className={`video-player ${failed ? "video-player-failed" : ""}`}>
      {source && (
        <video
          ref={videoRef}
          src={source}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Videopresentation"
          onCanPlay={() => videoRef.current?.play().catch(() => undefined)}
          onError={() => setFailed(true)}
        />
      )}
      {nextSource && (
        <video
          key={nextSource}
          className={`video-player-next ${nextReady ? "is-ready" : ""}`}
          src={nextSource}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onCanPlay={(event) => {
            event.currentTarget.play().catch(() => undefined);
            setNextReady(true);
          }}
          onError={() => {
            setNextSource("");
            setNextReady(false);
          }}
        />
      )}
    </div>
  );
}
