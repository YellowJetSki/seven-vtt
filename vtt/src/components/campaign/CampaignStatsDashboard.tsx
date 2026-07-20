/**
 * STᚱ VTT — Campaign Stats Dashboard (Premium Gold Version)
 *
 * Live statistics from the campaign store: character count, enemy count,
 * encounter count, map count, journal entries, session count.
 * Shows creation date and last updated timestamp.
 */

import type { CampaignMeta } from "@/types";
import SettingsSection from "./SettingsSection";

interface CampaignStatsDashboardProps {
  meta: CampaignMeta | null;
  liveStats: {
    characterCount: number;
    enemyCount: number;
    encounterCount: number;
    mapCount: number;
    journalCount: number;
  };
  onIncrementSession: () => void;
}

const STAT_CARDS: {
  key: keyof CampaignStatsDashboardProps["liveStats"];
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "characterCount", label: "Characters", icon: "👥", color: "text-amber-400" },
  { key: "enemyCount", label: "Enemies", icon: "👹", color: "text-rose-400" },
  { key: "encounterCount", label: "Encounters", icon: "⚔", color: "text-orange-400" },
  { key: "mapCount", label: "Maps", icon: "🗺", color: "text-emerald-400" },
  { key: "journalCount", label: "Journal Entries", icon: "📖", color: "text-indigo-400" },
];

export default function CampaignStatsDashboard({ meta, liveStats, onIncrementSession }: CampaignStatsDashboardProps) {
  const sessionCount = meta?.stats?.sessionCount || 0;

  return (
    <SettingsSection icon="📊" title="Campaign Statistics" description="Live counts from your campaign data">
      {/* Stat cards grid */}
      <div className="grid grid-cols-5 gap-2">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.key}
            className="bg-[#07080d]/70 border border-white/[0.04] rounded-xl p-2.5 text-center hover:border-gold-500/15 hover:shadow-[0_0_8px_rgba(234,179,8,0.02)] transition-all duration-200 group/stats"
          >
            <div className="text-lg">{stat.icon}</div>
            <div className={`text-base font-bold mt-0.5 tabular-nums ${stat.color}`}>
              {liveStats[stat.key]}
            </div>
            <div className="text-[8px] text-surface-600 mt-0.5 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Session counter */}
      <div className="flex items-center justify-between bg-[#07080d]/70 border border-white/[0.04] rounded-xl p-3 hover:border-gold-500/10 transition-all duration-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎲</span>
          <div>
            <div className="text-sm font-bold text-gold-300 tabular-nums">{sessionCount}</div>
            <div className="text-[9px] text-surface-600">Total Sessions</div>
          </div>
        </div>
        <button
          onClick={onIncrementSession}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-200"
        >
          + New Session
        </button>
      </div>

      {/* Campaign age */}
      {meta && (
        <div className="text-[9px] text-surface-600 text-center pt-1">
          Campaign created {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "N/A"}
          {meta.updatedAt !== meta.createdAt && meta.updatedAt && ` · Last updated ${new Date(meta.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        </div>
      )}
    </SettingsSection>
  );
}
