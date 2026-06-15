import {
  DAY_HALVES,
  DEFAULT_APP_TIMEZONE,
  SLOT_WINDOWS,
} from "@repo/domain";
import { HomeQuickLinks } from "@/components/home-quick-links";

export default function HomePage() {
  return (
    <main>
      <h1>Service marketplace</h1>
      <p>
        <strong>API (browser):</strong> same-origin <code>/api/*</code> → Nest (see{" "}
        <code>next.config.ts</code> rewrites, default upstream <code>127.0.0.1:3001</code>).
      </p>
      <HomeQuickLinks />
      <p>
        Monorepo app <code>@repo/web</code>. Slot rules come from shared{" "}
        <code>@repo/domain</code>.
      </p>
      <p>
        <strong>Timezone:</strong> {DEFAULT_APP_TIMEZONE}
      </p>
      <ul>
        {DAY_HALVES.map((half) => {
          const w = SLOT_WINDOWS[half];
          return (
            <li key={half}>
              <strong>{half}</strong> ({w.label}): {w.startHour}:
              {String(w.startMinute).padStart(2, "0")}–{w.endHour}:
              {String(w.endMinute).padStart(2, "0")} local
            </li>
          );
        })}
      </ul>
    </main>
  );
}
