/* ── DM Command Center ─────────────────────────────────────────
 * Full dashboard with campaign management, quick stats,
 * live session status, quick-action navigation, and campaign summary.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useDerivedCampaign } from "@/stores/campaign/useDerivedCampaign";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { ExportAllButton } from "@/components/ui/ExportAllButton";
import { ImportAllButton } from "@/components/ui/ImportAllButton";
import { Badge } from "@/components/ui/Badge";
import { ConditionsWidget } from "@/components/combat/ConditionsWidget";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { CampaignWizard } from "@/components/campaign/CampaignWizard";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { SummaryItem } from "@/components/dashboard/SummaryItem";
import { SessionStatusBar } from "@/components/dashboard/SessionStatusBar";

export function DmDashboard() {
  const campaign = useDerivedCampaign();
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const isLoading = useCampaignStore((s) => s.isLoading);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const startSession = useCombatStore((s) => s.startSession);
  const endSession = useCombatStore((s) => s.endSession);
  const showToast = useUiStore((s) => s.showToast);

  const homebrewItems = useHomebrewStore((s) => s.items.length);
  const homebrewFeats = useHomebrewStore((s) => s.feats.length);
  const homebrewSpells = useHomebrewStore((s) => s.spells.length);
  const totalHomebrew = homebrewItems + homebrewFeats + homebrewSpells;

  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const combatants = activeEncounter?.combatants ?? [];
  const aliveCount = combatants.filter((c) => !c.isDead).length;
  const deadCount = combatants.filter((c) => c.isDead).length;

  const handleImportCampaign = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.name || !data.id) { showToast({ message: "Invalid campaign file.", type: "error" }); return; }
        setCampaign(data);
        showToast({ message: `Imported "${data.name}"!`, type: "success" });
      } catch { showToast({ message: "Failed to parse campaign file.", type: "error" }); }
    };
    input.click();
  }, [setCampaign, showToast]);

  const handleExportCampaign = useCallback(() => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast({ message: `"${campaign.name}" exported.`, type: "success" });
  }, [campaign, showToast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pt-8">
        <div className="h-8 w-1/3 animate-pulse rounded bg-surface-700" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface-700" />
        <PageSkeleton rows={6} variant="card" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-12 animate-in fade-in duration-300">
        <div className="text-center">
          <span className="text-6xl text-surface-600">🗺️</span>
          <h2 className="mt-4 text-2xl font-bold text-surface-100">Welcome, Dungeon Master</h2>
          <p className="mt-2 text-sm text-surface-400">Start a new campaign or import an existing one to begin your adventure.</p>
        </div>
        {showNewCampaign ? (
          <CampaignWizard onClose={() => setShowNewCampaign(false)} onImport={handleImportCampaign} />
        ) : (
          <div className="space-y-4">
            <button onClick={() => setShowNewCampaign(true)}
              className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-accent-500/40 hover:bg-surface-700 hover:-translate-y-0.5">
              <span className="text-3xl">✨</span>
              <p className="mt-2 font-semibold text-surface-200">New Campaign</p>
              <p className="text-xs text-surface-500">Choose from Arkla template or create a custom campaign</p>
            </button>
            <button onClick={handleImportCampaign}
              className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700 hover:-translate-y-0.5">
              <span className="text-3xl">📥</span>
              <p className="mt-2 font-semibold text-surface-200">Import Campaign</p>
              <p className="text-xs text-surface-500">Load a campaign from a JSON file</p>
            </button>
          </div>
        )}
        <p className="text-center text-xs text-surface-500">Your campaign data is stored locally. Use export to back it up.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">{campaign.name}</h2>
          <p className="mt-1 text-sm text-surface-400 line-clamp-1">{campaign.description ?? "No description set."}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <ExportAllButton variant="secondary" size="sm" label="📤 Export All" />
          <ImportAllButton variant="secondary" size="sm" label="📥 Import All" />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" color="border-l-rogue-500" />
        <StatCard label="Encounters" value={campaign.encounters.length} icon="⚡" color="border-l-warrior-500" />
        <StatCard label="Maps" value={campaign.battleMaps.length} icon="🗺️" color="border-l-mage-500" />
        <StatCard label="Journal" value={campaign.journal.length} icon="📖" color="border-l-divine-500" />
        <StatCard label="Homebrew" value={totalHomebrew} icon="⚗️" color="border-l-accent-500"
          detail={totalHomebrew > 0 ? `${homebrewItems} items · ${homebrewFeats} feats · ${homebrewSpells} spells` : undefined} />
        <StatCard label="Combat" value={combatants.length} icon="⚔️" color="border-l-surface-500"
          detail={aliveCount > 0 ? `${aliveCount} alive · ${deadCount} defeated` : undefined} />
      </section>

      {/* Session Controls */}
      <SessionStatusBar liveSession={liveSession} onStart={() => { startSession(); showToast({ message: "Session started! Players can see live updates.", type: "success" }); }} onEnd={() => { endSession(); showToast({ message: "Session ended.", type: "info" }); }} />

      {/* Quick Actions + Conditions */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickActionButton label="Combat Center" icon="⚔️" to="/campaign/encounters" />
            <QuickActionButton label="New Player" icon="+" to="/campaign/player-cards" />
            <QuickActionButton label="Homebrew" icon="⚗️" to="/campaign/homebrew" />
            <QuickActionButton label="Journal Entry" icon="📝" to="/campaign/journal" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link to="/campaign/encounters" className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs font-medium text-warrior-400 hover:bg-warrior-500/20">⚡ Quick-Start Encounter</Link>
            <Link to="/campaign/maps" className="rounded-lg bg-mage-500/10 px-3 py-2 text-xs font-medium text-mage-400 hover:bg-mage-500/20">🗺️ Create Map</Link>
          </div>
        </section>
        <ConditionsWidget defaultExpanded />
      </div>

      {/* Recent Activity + Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivityFeed />
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <SummaryItem label="Encounters" value={campaign.encounters.length} />
            <SummaryItem label="Battle Maps" value={campaign.battleMaps.length} />
            <SummaryItem label="Journal Entries" value={campaign.journal.length} />
            <SummaryItem label="Homebrew Total" value={totalHomebrew} />
          </div>
          {totalHomebrew > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {homebrewItems > 0 && <Badge variant="neutral" size="xs">{homebrewItems} Items</Badge>}
              {homebrewFeats > 0 && <Badge variant="neutral" size="xs">{homebrewFeats} Feats</Badge>}
              {homebrewSpells > 0 && <Badge variant="neutral" size="xs">{homebrewSpells} Spells</Badge>}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={handleImportCampaign} className="text-xs text-surface-500 hover:text-surface-300">📥 Import</button>
            <span className="text-xs text-surface-600">·</span>
            <button onClick={handleExportCampaign} className="text-xs text-surface-500 hover:text-surface-300">📤 Export</button>
          </div>
        </section>
      </div>
    </div>
  );
}
