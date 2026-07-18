/* ── CharacterResourcesSummary ──────────────────────────────────
 * Compact display of class resources (Ki, Rage, Bardic Inspiration,
 * Channel Divinity, etc.) with current/max and recharge info.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

interface Props {
  character: PlayerCharacter;
}

export function CharacterResourcesSummary({ character }: Props) {
  const resources = character.resources ?? [];
  if (resources.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">⚡ Resources</p>
      <div className="flex flex-wrap gap-1">
        {resources.map((r, i) => {
          const pct = r.max > 0 ? (r.current / r.max) * 100 : 0;
          return (
            <div key={r.id ?? i} className="flex items-center gap-1 rounded bg-accent-500/10 px-1.5 py-0.5">
              <span className="text-[9px] text-surface-200 font-medium">{r.name}</span>
              <div className="w-6 h-1 rounded-full bg-surface-700 overflow-hidden">
                <div className={`h-full rounded-full ${pct > 0 ? "bg-accent-500" : "bg-warrior-500"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className={`text-[8px] font-mono ${r.current > 0 ? "text-accent-300" : "text-warrior-400"}`}>
                {r.current}/{r.max}
              </span>
              <span className="text-[7px] text-surface-500 uppercase">{rechargeLabel(r.recharge)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function rechargeLabel(recharge: string): string {
  const map: Record<string, string> = {
    short_rest: "SR", long_rest: "LR", dawn: "Dawn", dusk: "Dusk",
    special: "Spec",
  };
  return map[recharge] ?? recharge;
}
