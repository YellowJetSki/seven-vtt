import AppShell from "@/components/layout/AppShell";

export default function CampaignSettings() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="glass-crystal rounded-2xl p-6">
          <h1 className="text-2xl font-black text-gradient-arcane">Campaign Settings</h1>
          <div className="rune-divider mt-2">✦ ✦ ✦</div>
        </div>
        <div className="glass-arcane rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-surface-200 uppercase tracking-wider">Campaign Info</h2>
            <p className="text-surface-500 text-sm mt-1">No campaign created yet.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
