/* ── DM Command Center ─────────────────────────────────────────
 * Full dashboard with campaign management, quick stats,
 * live session status, and quick-action navigation.
 * ─────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { useState } from "react";

export function DmDashboard() {
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const showToast = useUiStore((s) => s.showToast);

  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");

  const combatants = activeEncounter?.combatants ?? [];
  const aliveCount = combatants.filter((c) => !c.isDead).length;
  const deadCount = combatants.filter((c) => c.isDead).length;
  const sessionBorderColor = liveSession.sessionStartedAt
    ? "border-l-accent-500"
    : "border-l-surface-500";

  const handleCreateCampaign = () => {
    const name = newCampaignName.trim();
    if (!name) return;
    const c = createDemoCampaign();
    c.name = name;
    c.description = newCampaignDesc.trim() || c.description;
    setCampaign(c);
    setShowNewCampaign(false);
    setNewCampaignName("");
    setNewCampaignDesc("");
    showToast({ message: `Campaign "${name}" created!`, type: "success" });
  };

  const handleImportCampaign = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.name || !data.id) {
          showToast({ message: "Invalid campaign file.", type: "error" });
          return;
        }
        setCampaign(data);
        showToast({ message: `Imported "${data.name}"!`, type: "success" });
      } catch {
        showToast({ message: "Failed to parse campaign file.", type: "error" });
      }
    };
    input.click();
  };

  const handleExportCampaign = () => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── No Campaign State ──
  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-12">
        <div className="text-center">
          <span className="text-6xl text-surface-600">🗺️</span>
          <h2 className="mt-4 text-2xl font-bold text-surface-100">Welcome, Dungeon Master</h2>
          <p className="mt-2 text-sm text-surface-400">
            Start a new campaign or import an existing one to begin your adventure.
          </p>
        </div>

        {/* Create/Import Campaign Cards */}
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-6">
          {!showNewCampaign ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowNewCampaign(true)}
                className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-accent-500/40 hover:bg-surface-700"
              >
                <span className="text-3xl">✨</span>
                <p className="mt-2 font-semibold text-surface-200">New Campaign</p>
                <p className="text-xs text-surface-500">Creates a new Arkla campaign with demo data</p>
              </button>
              <button
                onClick={handleImportCampaign}
                className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700"
              >
                <span className="text-3xl">📥</span>
                <p className="mt-2 font-semibold text-surface-200">Import Campaign</p>
                <p className="text-xs text-surface-500">Load a campaign from a JSON file</p>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-surface-200">New Campaign</h3>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
                <input value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g. The Obelisks of Arkla"
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-400">Description (optional)</label>
                <textarea value={newCampaignDesc} onChange={(e) => setNewCampaignDesc(e.target.value)} rows={3}
                  placeholder="A brief synopsis of the campaign..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNewCampaign(false)}
                  className="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-surface-200 transition-colors">Cancel</button>
                <button onClick={handleCreateCampaign} disabled={!newCampaignName.trim()}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors disabled:opacity-50">Create</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-surface-500">
          Your campaign data is stored locally. Use export to back it up.
        </p>
      </div>
    );
  }

  // ── Campaign Dashboard ──
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome Header */}
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">{campaign.name}</h2>
          <p className="mt-1 text-sm text-surface-400">{campaign.description ?? "No description set."}</p>
        </div>
        <button onClick={handleExportCampaign}
          className="self-start rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors">
          📤 Export Campaign
        </button>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" color="border-l-warrior-500" />
        <StatCard label="Combatants" value={combatants.length} icon="⚡" color="border-l-divine-500" />
        <StatCard label="Alive" value={aliveCount} icon="❤️" color="border-l-divine-400" detail={deadCount > 0 ? `${deadCount} down` : undefined} />
        <StatCard label="Round" value={activeEncounter?.round ?? 0} icon="🔄" color="border-l-mage-500" />
        <StatCard label="Session" value={liveSession.sessionStartedAt ? "Live" : "\u2014"} icon="🎙️" color={sessionBorderColor} />
      </section>

      {/* Live Status Bar */}
      {liveSession.sessionStartedAt && (
        <section className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
          <div className="flex items-center gap-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/20">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-pulse" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-accent-300">Session Active</p>
              <p className="text-xs text-accent-500">
                Phase: {liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}
                {activeEncounter?.phase === "active" && ` · Round ${activeEncounter.round}`}
              </p>
            </div>
            <span className="text-xs text-surface-500">{liveSession.currentScene ? "Scene set ✓" : "No scene"}</span>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickActionButton label="Combat Center" icon="⚔️" to="/encounters" />
          <QuickActionButton label="New Player" icon="+" to="/players" />
          <QuickActionButton label="Homebrew" icon="⚗️" to="/homebrew" />
          <QuickActionButton label="Journal Entry" icon="📝" to="/journal" />
        </div>
      </section>

      {/* Campaign Summary */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Summary</h3>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <SummaryItem label="Encounters" value={campaign.encounters.length} />
          <SummaryItem label="Battle Maps" value={campaign.battleMaps.length} />
          <SummaryItem label="Journal Entries" value={campaign.journal.length} />
          <SummaryItem label="Homebrew Items" value={0} />
        </div>
      </section>
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function StatCard({ label, value, icon, color, detail }: {
  label: string; value: number | string; icon: string; color: string; detail?: string;
}) {
  return (
    <div className={`rounded-lg border border-surface-700 bg-surface-850 p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold text-surface-100">{value}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-surface-400">{label}</p>
      {detail && <p className="text-[11px] text-warrior-400 mt-0.5">{detail}</p>}
    </div>
  );
}

function QuickActionButton({ label, icon, to }: { label: string; icon: string; to: string }) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 p-4 text-center transition-all hover:border-accent-500/30 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-surface-300">{label}</span>
    </Link>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-surface-100">{value}</p>
      <p className="text-xs text-surface-500 mt-1">{label}</p>
    </div>
  );
}
