/**
 * STᚱ VTT — Stat Card (Premium Gold)
 *
 * Campaign stat display card with gold-accented hover effects.
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
      <div className="absolute -inset-1 bg-gold-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <span className="text-[10px] text-surface-600 uppercase tracking-widest font-medium">{label}</span>
        </div>
        <div className="text-3xl font-black text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.1)]">
          {value}
        </div>

        {/* Gold shimmer bar */}
        <div className="mt-3 h-0.5 w-full shimmer-bar rounded-full bg-gold-500/8">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-gold-500/10 via-gold-400/30 to-gold-500/10" />
        </div>
      </div>
    </div>
  );
}
