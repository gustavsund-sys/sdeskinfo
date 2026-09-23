import type { OpeningHours } from "../types";
import { getOpeningStatus } from "../lib/openingHours";

export function OpeningHoursPanel({
  hours,
  now,
}: {
  hours: OpeningHours;
  now: Date;
}) {
  const state = getOpeningStatus(hours, now);
  return (
    <section
      className={`opening-hours-panel ${state.isOpen ? "is-open" : "is-closed"}`}
      aria-live="polite"
    >
      <div className="opening-hours-label">
        <span className="opening-dot" />
        Service desk
      </div>
      <strong>{state.status}</strong>
      <span>{state.detail}</span>
    </section>
  );
}
