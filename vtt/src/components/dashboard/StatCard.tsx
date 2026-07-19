/**
 * STᚱ VTT — Stat Card (Duolingo-Spotify Fusion)
 *
 * Premium campaign stat card with:
 * - Staggered icon + value zoom on entry
 * - Subtle gold edge light on hover
 * - Data-focused layout with clean typography
 * - No shimmer bar — instead a gold accent border that activates on hover
 * - Tap-to-expand feel with inset depth
 */

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  index?: number;
}

export default function StatCard({ label, value, icon, index = 0 }: StatCardProps) {
  return (
    <div
      className="group relative rounded-xl p-4 bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/80 border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-gold-500/15 hover:shadow-[0_0_20px_rgba(234,179,8,0.04),inset_0_1px_0_rgba(255,215,0,0.04)] active:scale-[0.98] overflow-hidden animate-slide-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Hover gold glow — directional sweep */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/6 via-transparent to-amber-500/3" />
      </div>

      {/* Gold edge line — bottom accent */}
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/20 transition-all duration-300" />

      <div className="relative z-10">
        {/* Top: icon + label row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg sm:text-xl leading-none group-hover:scale-110 transition-transform duration-200">{icon}</span>
          <span className="text-[9px] text-surface-500 uppercase tracking-[0.15em] font-medium truncate ml-2">
            {label}
          </span>
        </div>

        {/* Value — large, bold, gold */}
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/90 tabular-nums leading-none tracking-tight">
          {value}
        </p>

        {/* Small scale label below for visual anchor */}
        <p className="text-[8px] text-surface-700 uppercase tracking-widest mt-2 font-medium">
          Entries
        </p>
      </div>
    </div>
  );
}
