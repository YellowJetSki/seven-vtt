import type { JournalEntry } from "@/types";

interface RecentActivityProps {
  entries: JournalEntry[];
}

const typeIcons: Record<string, string> = {
  session: "📝", lore: "📜", quest: "⚡", note: "📌", handout: "📄",
};

export default function RecentActivity({ entries }: RecentActivityProps) {
  if (entries.length === 0) {
    return (
      <div className="premium-card rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
        <p className="text-surface-500 text-sm">No journal entries yet. Start documenting your campaign!</p>
      </div>
    );
  }

  return (
    <div className="premium-card rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {entries.slice(-5).reverse().map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/30">
            <span className="text-lg">{typeIcons[entry.type] ?? "📌"}</span>
            <div>
              <p className="text-sm font-medium text-white">{entry.title}</p>
              <p className="text-xs text-surface-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
