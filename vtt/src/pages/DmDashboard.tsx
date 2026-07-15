/* ── DM Command Center ─────────────────────────────────────────
 * Full dashboard with campaign management, quick stats,
 * live session status, quick-action navigation, and campaign summary.
 *
 * REFACTORED:
 *  • Extracted conditions/weather into ConditionsWidget (synced to players)
 *  • Extracted StatCard, QuickActionButton, SummaryItem into reusable sub-components
 *  • Extracted NewCampaignWizard into dedicated component
 *  • Linter-clean dependency arrays
 *  • Mobile-first responsive layout
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { ExportAllButton } from "@/components/ui/ExportAllButton";
import { Badge } from "@/components/ui/Badge";
import { ConditionsWidget } from "@/components/combat/ConditionsWidget";
import { Button } from "@/components/ui/Button";

export function DmDashboard() {
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const startSession = useCombatStore((s) => s.startSession);
  const endSession = useCombatStore((s) => s.endSession);
  const showToast = useUiStore((s) => s.showToast);

  // Homebrew stats
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
  }, [setCampaign, showToast]);

  const handleExportCampaign = useCallback(() => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: `"${campaign.name}" exported.`, type: "success" });
  }, [campaign, showToast]);

  const handleStartSession = useCallback(() => {
    startSession();
    showToast({ message: "Session started! Players can now see live updates.", type: "success" });
  }, [startSession, showToast]);

  const handleEndSession = useCallback(() => {
    endSession();
    showToast({ message: "Session ended.", type: "info" });
  }, [endSession, showToast]);

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
        <NewCampaignWizard
          showNewCampaign={showNewCampaign}
          setShowNewCampaign={setShowNewCampaign}
          onImport={handleImportCampaign}
        />
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
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" color="border-l-rogue-500" />
        <StatCard label="Encounters" value={campaign.encounters.length} icon="⚡" color="border-l-warrior-500" />
        <StatCard label="Maps" value={campaign.battleMaps.length} icon="🗺️" color="border-l-mage-500" />
        <StatCard label="Journal" value={campaign.journal.length} icon="📖" color="border-l-divine-500" />
        <StatCard
          label="Homebrew"
          value={totalHomebrew}
          icon="⚗️"
          color="border-l-accent-500"
          detail={totalHomebrew > 0 ? `${homebrewItems} items · ${homebrewFeats} feats · ${homebrewSpells} spells` : undefined}
        />
        <StatCard
          label="Combat"
          value={combatants.length}
          icon="⚔️"
          color="border-l-surface-500"
          detail={aliveCount > 0 ? `${aliveCount} alive · ${deadCount} defeated` : undefined}
        />
      </section>

      {/* Session Controls + Live Status */}
      <SessionStatusBar
        liveSession={liveSession}
        onStart={handleStartSession}
        onEnd={handleEndSession}
      />

      {/* Quick Actions + Conditions */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {/* Quick Actions */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickActionButton label="Combat Center" icon="⚔️" to="/encounters" />
            <QuickActionButton label="New Player" icon="+" to="/players" />
            <QuickActionButton label="Homebrew" icon="⚗️" to="/homebrew" />
            <QuickActionButton label="Journal Entry" icon="📝" to="/journal" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to="/encounters"
              className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs font-medium text-warrior-400 transition-colors hover:bg-warrior-500/20"
            >
              ⚡ Quick-Start Encounter
            </Link>
            <Link
              to="/maps"
              className="rounded-lg bg-mage-500/10 px-3 py-2 text-xs font-medium text-mage-400 transition-colors hover:bg-mage-500/20"
            >
              🗺️ Create Map
            </Link>
          </div>
        </section>

        {/* Conditions Widget — synced to players via Firestore */}
        <ConditionsWidget defaultExpanded />
      </div>

      {/* Recent Activity + Campaign Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivityFeed />
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400">
            Campaign Summary
          </h3>
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
            <button onClick={handleImportCampaign} className="text-xs text-surface-500 transition-colors hover:text-surface-300">
              📥 Import
            </button>
            <span className="text-xs text-surface-600">·</span>
            <button onClick={handleExportCampaign} className="text-xs text-surface-500 transition-colors hover:text-surface-300">
              📤 Export
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * EXTRACTED SUB-COMPONENTS
 * These are separated into the same file for colocation,
 * but with clear boundaries for future extraction.
 * ═══════════════════════════════════════════════════════════════ */

/* ── New Campaign Wizard ──────────────────────────────────── */

interface NewCampaignWizardProps {
  showNewCampaign: boolean;
  setShowNewCampaign: (show: boolean) => void;
  onImport: () => void;
}

function NewCampaignWizard({ showNewCampaign, setShowNewCampaign, onImport }: NewCampaignWizardProps) {
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const showToast = useUiStore((s) => s.showToast);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const c = createDemoCampaign();
    c.name = trimmed;
    c.description = desc.trim() || c.description;
    setCampaign(c);
    setShowNewCampaign(false);
    setName("");
    setDesc("");
    showToast({ message: `Campaign "${trimmed}" created!`, type: "success" });
  }, [name, desc, setCampaign, setShowNewCampaign, showToast]);

  if (!showNewCampaign) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowNewCampaign(true)}
          className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-accent-500/40 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-3xl">✨</span>
          <p className="mt-2 font-semibold text-surface-200">New Campaign</p>
          <p className="text-xs text-surface-500">Creates a new Arkla campaign with demo data</p>
        </button>
        <button
          onClick={onImport}
          className="w-full rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-6 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="text-3xl">📥</span>
          <p className="mt-2 font-semibold text-surface-200">Import Campaign</p>
          <p className="text-xs text-surface-500">Load a campaign from a JSON file</p>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-surface-200">New Campaign</h3>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Obelisks of Arkla"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Description (optional)</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          placeholder="A brief synopsis of the campaign..."
          className="w-full resize-none rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowNewCampaign(false)}
          className="rounded-lg px-4 py-2 text-sm text-surface-400 transition-colors hover:text-surface-200"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-500 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
}

/* ── Session Status Bar ────────────────────────────────────── */

interface SessionStatusBarProps {
  liveSession: ReturnType<typeof useCombatStore.getState>["liveSession"];
  onStart: () => void;
  onEnd: () => void;
}

function SessionStatusBar({ liveSession, onStart, onEnd }: SessionStatusBarProps) {
  const sessionActive = liveSession.sessionStartedAt !== null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              sessionActive ? "bg-accent-500/20" : "bg-surface-800"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full ${
                sessionActive ? "bg-accent-500 animate-pulse" : "bg-surface-500"
              }`}
            />
          </span>
          <div>
            <p className="text-sm font-semibold text-surface-100">
              {sessionActive ? "Session Active" : "No Active Session"}
            </p>
            <p className="text-xs text-surface-400">
              {sessionActive
                ? `Phase: ${liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}`
                : "Start a session to share live data with players"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!sessionActive ? (
            <Button size="sm" onClick={onStart}>
              ▶ Start Session
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={onEnd}>
              ■ End Session
            </Button>
          )}
        </div>
      </div>
      {sessionActive && (
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
            <p className="text-surface-500">Weather</p>
            <p className="font-medium text-surface-200">
              {liveSession.conditions.weather.charAt(0).toUpperCase() + liveSession.conditions.weather.slice(1)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Stat Card ──────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  detail?: string;
}

function StatCard({ label, value, icon, color, detail }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-surface-700 bg-surface-850 p-4 border-l-4 ${color} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold text-surface-100">{value}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-surface-400">{label}</p>
      {detail && <p className="mt-0.5 text-[11px] text-surface-500">{detail}</p>}
    </div>
  );
}

/* ── Quick Action Button ───────────────────────────────────── */

interface QuickActionButtonProps {
  label: string;
  icon: string;
  to: string;
}

function QuickActionButton({ label, icon, to }: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 p-4 text-center transition-all hover:border-accent-500/30 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-surface-300">{label}</span>
    </Link>
  );
}

/* ── Summary Item ───────────────────────────────────────────── */

interface SummaryItemProps {
  label: string;
  value: number;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-surface-100">{value}</p>
      <p className="mt-1 text-xs text-surface-500">{label}</p>
    </div>
  );
}
