import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function PlayerCards() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="glass-crystal rounded-2xl p-6">
          <h1 className="text-2xl font-black text-gradient-arcane">Player Characters</h1>
          <div className="rune-divider mt-2">✦ ✦ ✦</div>
        </div>
        <EmptyState
          icon="👥"
          title="No Characters Yet"
          description="Create player characters for your campaign."
        >
          <Button variant="arcane" size="lg" className="mt-4">✦ New Character</Button>
        </EmptyState>
      </div>
    </AppShell>
  );
}
