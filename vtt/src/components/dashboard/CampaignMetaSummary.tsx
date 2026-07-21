/**
 * STᚱ VTT — Campaign Meta Summary (Overrrides-Grade KPI Strip)
 *
 * A Duolingo/Spotify-inspired compact summary strip showing critical
 * campaign health metrics at a glance.
 *
 * Metrics:
 * - Campaign age (days since creation)
 * - Session count
 * - Monster library size
 * - Total encounters
 * - Total maps
 * - Journal entries
 *
 * Each metric is a compact card with icon, value, and label.
 * Staggered entrance with spring physics via Framer Motion tokens.
 */

import type { CampaignMeta } from "@/types";
import { staggerEntrance, shadows, glass } from "@/lib/design-tokens";

interface CampaignMetaSummaryProps {
  meta: CampaignMeta;
  characterCount: number;
  enemyCount: number;
  encounterCount: number;
  mapCount: number;
  journalCount: number;
}

function formatCampaignAge(createdAt: number): string {
  const days = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return months === 1 ? `1 month${remDays > 0 ? ` ${remDays}d` : ""}` : `${months} months${remDays > 0 ? ` ${remDays}d` : ""}`;
}

export default function CampaignMetaSummary({
  meta,
  characterCount,
  enemyCount,
  encounterCount,
  mapCount,
  journalCount,
}: CampaignMetaSummaryProps) {
  const stats = meta.stats;

  const items = [
    { icon: "📅", label: "Campaign Age", value: formatCampaignAge(meta.createdAt), accent: "gold" as const },
    { icon: "🎲", label: "Sessions Run", value: String(stats.sessionCount || 0), accent: "amber" as const },
    { icon: "👥", label: "Party Size", value: String(characterCount), accent: "emerald" as const },
    { icon: "🐉", label: "Monsters", value: String(enemyCount), accent: "rose" as const },
    { icon: "⚔", label: "Encounters", value: String(encounterCount), accent: "rose" as const },
    { icon: "🗺", label: "Maps", value: String(mapCount), accent: "violet" as const },
    { icon: "📖", label: "Journal", value: String(journalCount), accent: "cyan" as const },
  ];

  const accentMap = {
    gold: "border-gold-500/20 from-gold-500/8",
    amber: "border-amber-500/20 from-amber-500/8",
    emerald: "border-emerald-500/20 from-emerald-500/8",
    rose: "border-rose-500/20 from-rose-500/8",
    violet: "border-violet-500/20 from-violet-500/8",
    cyan: "border-cyan-500/20 from-cyan-500/8",
  };

  return (
    <div className="bg-gradient-to-b from-[#141520]/70 to-[#0f1019]/75 border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Mini gold edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

      <div className="p-3">
        <div className="flex flex-wrap items-stretch gap-1.5">
          {items.map((item, idx) => (
            <div
              key={item.label}
              className="flex-1 min-w-[80px] group relative rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.03] p-2.5 transition-all duration-200 hover:border-white/[0.07] hover:-translate-y-0.5 active:scale-[0.98]"
              style={staggerEntrance(idx, 30)}
            >
              {/* Accent line at top */}
              <div className={`absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${accentMap[item.accent].split(" ")[0].replace("border-", "text-")}`} />

              {/* Directional hover glow */}
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${accentMap[item.accent].split(" from-")[1] ? `from-${accentMap[item.accent].split(" from-")[1]}/5` : ""} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10 flex items-center gap-2">
                <span className="text-sm leading-none shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/85 tabular-nums leading-tight">
                    {item.value}
                  </p>
                  <p className="text-[7px] text-surface-500 uppercase tracking-wider mt-0.5 truncate">
                    {item.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
