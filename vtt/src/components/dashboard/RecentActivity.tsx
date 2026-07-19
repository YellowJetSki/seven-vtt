/**
 * STᚱ VTT — Recent Activity (Vertical Timeline)
 *
 * Premium timeline feed with gold dot connectors:
 * - Left-aligned gold dot + connecting line
 * - Each entry slides in with staggered delay
 * - Type badges with color-coded accents
 * - Empty state with subtle illustration
 */

import type { JournalEntry } from "@/types";

interface RecentActivityProps {
  entries: JournalEntry[];
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  session: { icon: "📝", color: "border-gold-500/30" },
  lore: { icon: "📜", color: "border-amber-500/30" },
  quest: { icon: "⚡", color: "border-gold-400/30" },
  note: { icon: "📌", color: "border-surface-500/30" },
  handout: { icon: "📄", color: "border-gold-500/20" },
};

export default function RecentActivity({ entries }: RecentActivityProps) {
  const recentEntries = entries.slice(-5).reverse();

  return (
    <div className="rounded-xl bg-gradient-to-b from-[#191b2b]/60 to-[#12131e]/70 border border-white/[0.04] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-black text-white/80 uppercase tracking-[0.1em]">
          Recent Activity
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.04] to-transparent" />
        {recentEntries.length > 0 && (
          <span className="text-[9px] text-surface-600 font-medium tabular-nums">
            {recentEntries.length} entries
          </span>
        )}
      </div>

      {recentEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          {/* Empty state illustration */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/10 flex items-center justify-center mb-4">
            <span className="text-2xl opacity-40">📖</span>
          </div>
          <p className="text-sm text-surface-500 font-medium">No activity yet</p>
          <p className="text-[11px] text-surface-600 mt-1">Your campaign chronicle starts here</p>
          <div className="flex items-center gap-2 mt-4 text-[8px] text-gold-500/25 uppercase tracking-[0.2em]">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
            <span>✦ ᚱ ✦</span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-gold-500/20 via-gold-500/10 to-transparent pointer-events-none" />

          <div className="space-y-3">
            {recentEntries.map((entry, idx) => {
              const config = typeConfig[entry.type] ?? typeConfig.note;
              return (
                <div
                  key={entry.id}
                  className="relative flex items-start gap-4 pl-1 animate-slide-in-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="relative shrink-0 mt-1">
                    <div className={`w-[10px] h-[10px] rounded-full border-2 ${config.color} bg-[#12131e] shadow-[0_0_6px_rgba(234,179,8,0.08)]`} />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 min-w-0 pb-3 group">
                    <div className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5 shrink-0">{config.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors duration-200">
                            {entry.title}
                          </p>
                          <span className="text-[8px] uppercase tracking-wider text-gold-400/50 bg-gold-500/8 border border-gold-500/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {entry.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-surface-600">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {entry.tags && entry.tags.length > 0 && (
                            <span className="text-[9px] text-surface-600/60">
                              · {entry.tags.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
