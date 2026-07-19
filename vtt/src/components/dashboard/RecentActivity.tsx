/**
 * STᚱ VTT — Recent Activity (Premium Gold)
 *
 * Recent journal entries display with gold-accented cards.
 */

import type { JournalEntry } from "@/types";

interface RecentActivityProps {
  entries: JournalEntry[];
}

const typeIcons: Record<string, string> = {
  session: "📝",
  lore: "📜",
  quest: "⚡",
  note: "📌",
  handout: "📄",
};

export default function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <div className="premium-card-gold rounded-xl p-6 relative">
      <div className="corner-ornament corner-tl corner-gold" />
      <div className="corner-ornament corner-tr corner-gold" />
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-lg font-black text-gold">Recent Activity</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-gold-500/20 to-transparent" />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-surface-500 text-sm italic">No journal entries yet. Begin your chronicle!</p>
          <div className="rune-gold mt-4 justify-center">ᚱ</div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries
            .slice(-5)
            .reverse()
            .map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-800/30 border border-gold/10 hover:border-gold/20 transition-all duration-200 animate-slide-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className="text-lg mt-0.5" aria-hidden="true">
                  {typeIcons[entry.type] ?? "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-200 truncate">
                    {entry.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded">
                      {entry.type}
                    </span>
                    <span className="text-xs text-surface-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
