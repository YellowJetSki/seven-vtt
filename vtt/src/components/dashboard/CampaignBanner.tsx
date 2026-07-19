/**
 * STᚱ VTT — Campaign Banner (Duolingo-Grade Premium)
 *
 * Multi-layer hero banner with animated depth:
 * - Gold edge-lit glass surface with subtle grain
 * - Animated rune motif that breathes
 * - Campaign name + description with refined typography
 * - Dynamic stat clusters that float into view
 */

import type { CampaignMeta } from "@/types";

interface CampaignBannerProps {
  meta: CampaignMeta;
  stats: { label: string; value: number; icon: string }[];
}

export default function CampaignBanner({ meta, stats }: CampaignBannerProps) {
  // Calculate total entries
  const total = stats.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#181a2a]/80 via-[#12131e]/85 to-[#0c0d15]/90 border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.02)]">
      {/* Depth ring — subtle conic gradient */}
      <div className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.3)_20%,transparent_40%,rgba(234,179,8,0.15)_60%,transparent_80%)] animate-depth-rotate" style={{ animationDuration: '30s' }} />

      {/* Top gold edge light */}
      <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />

      {/* Ambient glow pocket — upper right */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8">
        {/* Top row: rune + stats cluster */}
        <div className="flex items-start justify-between gap-6">
          {/* Left: Rune + Title */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Animated rune */}
            <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gold-500/15 to-transparent opacity-40" />
              <span className="text-xl sm:text-2xl font-serif text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] rune-pulse">
                ᚱ
              </span>
            </div>

            {/* Title block */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                {meta.name}
              </h1>
              <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed max-w-xl line-clamp-2">
                {meta.description}
              </p>
              {/* Meta badges */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/8 border border-gold-500/15 px-2 py-1 rounded font-medium">
                  ✦ Campaign Active
                </span>
                <span className="text-[9px] text-surface-500 uppercase tracking-wider">
                  {total} total entries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cluster — floating data points */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.04]">
          <div className="flex items-stretch gap-px">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-200 hover:bg-white/[0.02] rounded-lg group relative"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Gold hover accent line */}
                <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/20 transition-all duration-300" />

                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="text-base sm:text-lg leading-none shrink-0">{stat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-black text-white/90 tabular-nums leading-tight">
                      {stat.value}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-surface-500 uppercase tracking-wider mt-0.5 truncate">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
