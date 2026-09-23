import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { DisplaySettings, ServiceMessage } from "../types";
import { activeAt } from "../lib/time";
import { SlidePlayer } from "./SlidePlayer";
import { PptxPlayer } from "./PptxPlayer";
import { OpeningHoursPanel } from "./OpeningHoursPanel";
export function DisplayCanvas({
  settings,
  messages,
  preview = false,
}: {
  settings: DisplaySettings;
  messages: ServiceMessage[];
  preview?: boolean;
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
  const width = 15;
  return (
    <main
      className={`display-canvas ${message ? "has-message" : ""} ${urgent ? "is-urgent" : ""} ${preview ? "is-preview" : ""}`}
    >
      <div className="display-content">
        <aside className="display-sidebar" style={{ width: `${width}%` }}>
          {message ? (
            <section
              className={`info-panel priority-${message.priority} type-${message.type}`}
              aria-live="polite"
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
            >
              <Info className="empty-info-icon" aria-hidden="true" />
            </section>
          )}
          <OpeningHoursPanel hours={settings.openingHours} now={now} />
        </aside>
        <section className="presentation-pane">
          <div className="presentation-stage">
            {settings.presentationId ? (
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
