/**
 * STᚱ VTT — Stat Card (Premium Gold — Enhanced)
 *
 * Campaign stat display card with richer gold accents,
 * improved label readability, animated shimmer border,
 * and subtle hover depth.
 */

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="premium-card-gold hover-lift rounded-xl p-4 relative overflow-hidden group">
      {/* Gold hover glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-gold-500/8 via-transparent to-amber-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* Active shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/3 to-transparent -skew-y-6 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
      </div>

      <div className="relative z-10">
        {/* Header — icon + label with gold accent */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <span className="text-[10px] text-surface-500 uppercase tracking-widest font-medium">
            {label}
          </span>
        </div>

        {/* Value with gold gradient */}
        <div className="text-3xl font-black text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.1)]">
          {value}
        </div>

        {/* Gold shimmer bar — animated */}
        <div className="mt-3 h-[3px] w-full rounded-full bg-obsidian/60 overflow-hidden relative">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-gold-500/20 via-gold-400/40 to-gold-500/20 shimmer-bar" />
          {/* Animated accent dot */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-400/30 to-transparent animate-shimmer-dot" />
        </div>
      </div>
    </div>
  );
}
