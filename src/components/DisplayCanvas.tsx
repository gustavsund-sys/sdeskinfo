import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { DisplaySettings, ServiceMessage } from "../types";
import { activeAt } from "../lib/time";
import { displayFontStack } from "../lib/fonts";
import { SlidePlayer } from "./SlidePlayer";
import { PptxPlayer } from "./PptxPlayer";
import { OpeningHoursPanel } from "./OpeningHoursPanel";
import { VideoPlayer } from "./VideoPlayer";
import { VIDEO_VERSION } from "../generatedVideoVersion";
export function DisplayCanvas({
  settings,
  messages,
  preview = false,
  tizen = false,
}: {
  settings: DisplaySettings;
  messages: ServiceMessage[];
  preview?: boolean;
  tizen?: boolean;
}) {
  const [now, setNow] = useState(new Date());
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const active = useMemo(
    () =>
      messages
        .filter((m) => activeAt(m, now))
        .sort(
          (a, b) =>
            ({ urgent: 0, important: 1, normal: 2 })[a.priority] -
            { urgent: 0, important: 1, normal: 2 }[b.priority],
        ),
    [messages, now],
  );
  useEffect(() => {
    if (!active.length) return;
    const id = setInterval(
      () => setMessageIndex((i) => (i + 1) % active.length),
      Math.max(3, settings.messageRotationTime) * 1000,
    );
    return () => clearInterval(id);
  }, [active.length, settings.messageRotationTime]);
  useEffect(() => {
    if (messageIndex >= active.length) setMessageIndex(0);
  }, [active.length, messageIndex]);
  const message = active[messageIndex];
  const urgent = message?.priority === "urgent";
  const width = 25;
  const use1080Fallback =
    tizen && new URLSearchParams(window.location.search).get("video") === "1080p";
  const hostedVideoUrl = `${import.meta.env.BASE_URL}media/${
    use1080Fallback
      ? "infoskarmen-2026-09-1080p.mp4"
      : "infoskarmen-production.mp4"
  }?v=${encodeURIComponent(VIDEO_VERSION)}`;
  return (
    <main
      className={`display-canvas ${message ? "has-message" : ""} ${urgent ? "is-urgent" : ""} ${preview ? "is-preview" : ""} ${tizen ? "is-tizen" : ""}`}
    >
      <div className="display-content">
        <aside className="display-sidebar" style={{ width: `${width}%` }}>
          {message ? (
            <section
              className={`info-panel priority-${message.priority} type-${message.type}`}
              aria-live="polite"
              style={{ fontFamily: displayFontStack(settings.infoFontFamily) }}
            >
              <div className="info-copy">
                <h1>{message.title}</h1>
                <p>{message.body}</p>
              </div>
              {active.length > 1 && (
                <footer>
                  <span>
                    {messageIndex + 1} / {active.length}
                  </span>
                </footer>
              )}
            </section>
          ) : (
            <section
              className="info-panel info-panel-empty"
              aria-label="Ingen aktuell information"
              style={{ fontFamily: displayFontStack(settings.infoFontFamily) }}
            >
              <Info className="empty-info-icon" aria-hidden="true" />
            </section>
          )}
          <OpeningHoursPanel
            hours={settings.openingHours}
            now={now}
            fontFamily={displayFontStack(settings.openingHoursFontFamily)}
          />
        </aside>
        <section className="presentation-pane">
          <div className="presentation-stage">
            {hostedVideoUrl ? (
              <VideoPlayer sourceUrl={hostedVideoUrl} />
            ) : settings.presentationId && settings.presentationType === "video" ? (
              <VideoPlayer presentationId={settings.presentationId} />
            ) : settings.presentationId ? (
              <PptxPlayer
                presentationId={settings.presentationId}
                duration={settings.slideDuration}
              />
            ) : (
              <SlidePlayer
                slides={settings.slides}
                duration={settings.slideDuration}
                transition={settings.transitionDuration}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
