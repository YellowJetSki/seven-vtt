/* ── PlayerViewPreview ─────────────────────────────────────────
 * Preview of what the player-facing UI will show.
 * ─────────────────────────────────────────────────────────────── */

import type { LiveSessionState } from "@/types/combat";

interface Props {
  liveSession: LiveSessionState;
  sceneInput: string;
  mapUrlInput: string;
  announcementInput: string;
  ambientUrl: string;
  hours: number;
  minutes: number;
  secs: number;
}

const PHASE_STYLES: Record<string, string> = {
  combat: "bg-warrior-500/20 text-warrior-400",
  rest: "bg-divine-500/20 text-divine-400",
  exploration: "bg-mage-500/20 text-mage-400",
  downtime: "bg-surface-500/20 text-surface-400",
};
const PHASE_ICONS: Record<string, string> = { exploration: "🧭", combat: "⚔️", rest: "🛏️", downtime: "🏙️" };

export function PlayerViewPreview({ liveSession, sceneInput, mapUrlInput, announcementInput, ambientUrl, hours, minutes, secs }: Props) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Player View Preview</h4>
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PHASE_STYLES[liveSession.phase] ?? "bg-surface-500/20 text-surface-400"}`}>
            {PHASE_ICONS[liveSession.phase] ?? "•"} {liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}
          </span>
          <span className="text-[11px] text-surface-500">{hours > 0 ? `${hours}:` : ""}{minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</span>
        </div>

        {(sceneInput || liveSession.currentScene) && (
          <div className="mb-3"><p className="text-sm text-surface-300 leading-relaxed">{liveSession.currentScene || sceneInput}</p></div>
        )}

        {(mapUrlInput || liveSession.currentMapUrl) && (
          <div className="mb-3 overflow-hidden rounded-lg border border-surface-700">
            <img src={liveSession.currentMapUrl || mapUrlInput} alt="Current map" className="w-full object-cover bg-surface-800" style={{ maxHeight: "160px" }} />
          </div>
        )}

        {ambientUrl && (
          <div className="mb-3 rounded-lg bg-surface-800 p-2 flex items-center gap-2">
            <span className="text-sm">🎵</span>
            <span className="text-xs text-surface-400 truncate flex-1">{ambientUrl}</span>
            <span className="text-[10px] text-divine-400">Shared</span>
          </div>
        )}

        {(announcementInput || liveSession.dmAnnouncement) && (
          <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-1"><span className="text-xs text-accent-400 font-medium">📢 DM</span></div>
            <p className="text-sm text-accent-200">{liveSession.dmAnnouncement || announcementInput}</p>
          </div>
        )}

        {!sceneInput && !mapUrlInput && !announcementInput && !ambientUrl && (
          <p className="text-sm text-surface-500 italic">Fill in the fields on the left, then broadcast.</p>
        )}
      </div>
    </div>
  );
}
