import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function DmJournal() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="glass-crystal rounded-2xl p-6">
          <h1 className="text-2xl font-black text-gradient-arcane">Journal</h1>
          <div className="rune-divider mt-2">✦ ✦ ✦</div>
        </div>
        <EmptyState
          icon="📖"
          title="No Journal Entries"
          description="Document your campaign's lore, quests, and session notes."
        >
          <Button variant="arcane" size="lg" className="mt-4">✦ New Entry</Button>
        </EmptyState>
      </div>
    </AppShell>
  );
}
