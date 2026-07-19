import AppShell from "@/components/layout/AppShell";

export default function CampaignSettings() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="glass-gold rounded-2xl p-6 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              Campaign Settings
            </h1>
            <div className="rune-gold mt-3 w-full max-w-md">✦ ✦ ✦</div>
          </div>
        </div>
        <div className="glass-gold rounded-2xl p-6 space-y-6 relative">
          <div className="corner-ornament corner-tl corner-gold" />
          <div className="corner-ornament corner-tr corner-gold" />
          <div>
            <h2 className="text-sm font-bold text-gold uppercase tracking-wider">Campaign Info</h2>
            <p className="text-surface-500 text-sm mt-1">No campaign created yet.</p>
          </div>
          <div className="rune-gold">✦ ᚱ ✦</div>
        </div>
      </div>
    </AppShell>
  );
}
