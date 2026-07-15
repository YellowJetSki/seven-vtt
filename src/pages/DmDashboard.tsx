/* ── DM Command Center ─────────────────────────────────────────
 * Full dashboard with campaign management, quick stats,
 * live session status, quick-action navigation, and recent activity.
 * Enhanced with animated stat cards, inline import, and session controls.
 * ─────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { useState } from "react";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { ExportAllButton } from "@/components/ui/ExportAllButton";

export function DmDashboard() {
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const startSession = useCombatStore((s) => s.startSession);
  const endSession = useCombatStore((s) => s.endSession);
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

  const handleStartSession = () => {
    startSession();
    showToast({ message: "Session started! Players can now see live updates.", type: "success" });
  };

  const handleEndSession = () => {
    endSession();
    showToast({ message: "Session ended.", type: "info" });
  };

  // ── No Campaign State ──
  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-12 animate-in fade-in duration-300">
        <div className="text-center">
          <span className="text-6xl text-surface-600">🗺️</span>
          <h2 className="mt-4 text-2xl font-bold text-surface-100">Welcome, Dungeon Master</h2>
          <p className="mt-2 text-sm text-surface-400">
            Start a new campaign or import an existing one to begin your adventure.
          </p>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-850 p-6">
          {!showNewCampaign ? (
            <div className="space-y-4">
              <button onClick={() => setShowNewCampaign(true)}
                className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-accent-500/40 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0">
                <span className="text-3xl">✨</span>
                <p className="mt-2 font-semibold text-surface-200">New Campaign</p>
                <p className="text-xs text-surface-500">Creates a new Arkla campaign with demo data</p>
              </button>
              <button onClick={handleImportCampaign}
                className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0">
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
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">{campaign.name}</h2>
          <p className="mt-1 text-sm text-surface-400 line-clamp-1">{campaign.description ?? "No description set."}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <ExportAllButton variant="secondary" size="sm" label="📦 Full Backup" />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" color="border-l-rogue-500" />
        <StatCard label="Encounters" value={campaign.encounters.length} icon="⚡" color="border-l-warrior-500" />
        <StatCard label="Maps" value={campaign.battleMaps.length} icon="🗺️" color="border-l-mage-500" />
        <StatCard label="Journal" value={campaign.journal.length} icon="📖" color="border-l-divine-500" />
        <StatCard
          label="Combat"
          value={combatants.length}
          icon="⚔️"
          color="border-l-accent-500"
          detail={aliveCount > 0 ? `${aliveCount} alive` : undefined}
        />
      </section>

      {/* Session Controls + Live Status Bar */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              liveSession.sessionStartedAt ? "bg-accent-500/20" : "bg-surface-800"
            }`}>
              <span className={`h-3 w-3 rounded-full ${liveSession.sessionStartedAt ? "bg-accent-500 animate-pulse" : "bg-surface-500"}`} />
            </span>
            <div>
              <p className="text-sm font-semibold text-surface-100">
                {liveSession.sessionStartedAt ? "Session Active" : "No Active Session"}
              </p>
              <p className="text-xs text-surface-400">
                {liveSession.sessionStartedAt
                  ? `Phase: ${liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}`
                  : "Start a session to share live data with players"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!liveSession.sessionStartedAt ? (
              <button
                onClick={handleStartSession}
                className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-500 transition-colors"
              >
                ▶ Start Session
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="rounded-lg border border-warrior-500/30 px-4 py-2 text-xs font-semibold text-warrior-400 hover:bg-warrior-500/10 transition-colors"
              >
                ■ End Session
              </button>
            )}
          </div>
        </div>
        {liveSession.sessionStartedAt && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-surface-800 p-2">
              <p className="text-surface-500">Phase</p>
              <p className="font-medium text-surface-200 capitalize">{liveSession.phase}</p>
            </div>
            <div className="rounded-lg bg-surface-800 p-2">
              <p className="text-surface-500">Scene</p>
              <p className="font-medium text-surface-200 truncate">{liveSession.currentScene ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-surface-800 p-2">
              <p className="text-surface-500">Encounters</p>
              <p className="font-medium text-surface-200">{campaign.encounters.length}</p>
            </div>
          </div>
        )}
      </section>

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

      {/* Recent Activity + Campaign Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivityFeed />
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <SummaryItem label="Encounters" value={campaign.encounters.length} />
            <SummaryItem label="Battle Maps" value={campaign.battleMaps.length} />
            <SummaryItem label="Journal Entries" value={campaign.journal.length} />
            <SummaryItem label="Homebrew Items" value={0} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleImportCampaign} className="text-xs text-surface-500 hover:text-surface-300 transition-colors">
              📥 Import
            </button>
            <span className="text-xs text-surface-600">·</span>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign.json`;
              a.click();
              URL.revokeObjectURL(url);
              showToast({ message: `"${campaign.name}" exported.`, type: "success" });
            }} className="text-xs text-surface-500 hover:text-surface-300 transition-colors">
              📤 Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function StatCard({ label, value, icon, color, detail }: {
  label: string; value: number | string; icon: string; color: string; detail?: string;
}) {
  return (
    <div className={`rounded-lg border border-surface-700 bg-surface-850 p-4 border-l-4 ${color} transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
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
