/**
 * STᚱ VTT — Campaign Banner (Lusion-Grade Premium Overhaul)
 *
 * Premium hero banner with architectural depth:
 * - 7-layer depth composition (void bg → conic ring → edge light → glow pocket → glass card → content → hover animations)
 * - Animated conic gradient depth ring rotating over 30s
 * - Rune with ambient glow pocket and pulse animation
 * - Stat cluster with gold hover accent lines
 * - Sophisticated typographic hierarchy with letter-spacing
 * - Duolingo-grade stat counters with staggered entrance
 */

import type { CampaignMeta } from "@/types";

interface CampaignBannerProps {
  meta: CampaignMeta;
  stats: { label: string; value: number; icon: string }[];
}

export default function CampaignBanner({ meta, stats }: CampaignBannerProps) {
  const total = stats.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      {/* ── Layer 1: Deep void background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />

      {/* ── Layer 2: Conic gradient depth ring (slow rotate) ── */}
      <div
        className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
        style={{
          animation: "spin 30s linear infinite",
        }}
      />

      {/* ── Layer 3: Top gold edge light ── */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />

      {/* ── Layer 4: Bottom edge light on hover ── */}
      <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />

      {/* ── Layer 5: Ambient glow pockets ── */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

      {/* ── Layer 6: Border ── */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

      {/* ── Layer 7: Content ── */}
      <div className="relative z-10 p-6 sm:p-8">
        {/* Top row: rune + title + stats */}
        <div className="flex items-start justify-between gap-6">
          {/* Left: Rune + Title */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Premium rune container with depth ring */}
            <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
              {/* Rune bg depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
              <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
              {/* Inner glow */}
              <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
              {/* Rune character */}
              <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-serif text-gold-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                ᚱ
              </span>
            </div>

            {/* Title block */}
            <div className="min-w-0 pt-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                {meta.name}
              </h1>
              <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed max-w-xl line-clamp-2">
                {meta.description}
              </p>
              {/* Meta badges */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                  Campaign Active
                </span>
                <span className="text-[9px] text-surface-500 uppercase tracking-wider">
                  {total} total entries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats cluster ── */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.04]">
          <div className="flex items-stretch gap-px">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="flex-1 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-200 hover:bg-white/[0.02] rounded-lg group/stat relative"
                style={{
                  animation: `slideInUp 0.4s ease-out ${idx * 80}ms both`,
                }}
              >
                {/* Gold hover accent line */}
                <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover/stat:via-gold-500/25 transition-all duration-300" />

                {/* Hover directional glow */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-500/[0.02] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />

                <div className="relative flex items-center gap-2 sm:gap-2.5">
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
