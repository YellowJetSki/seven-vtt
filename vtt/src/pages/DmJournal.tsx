import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function DmJournal() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="glass-gold rounded-2xl p-6 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              Journal
            </h1>
            <div className="rune-gold mt-3 w-full max-w-md">✦ ✦ ✦</div>
          </div>
        </div>
        <EmptyState
          icon="📖"
          title="No Journal Entries"
          description="Document your campaign's lore, quests, and session notes."
        >
          <Button variant="gold" size="lg" className="mt-4">✦ New Entry</Button>
        </EmptyState>
      </div>
    </AppShell>
  );
}
