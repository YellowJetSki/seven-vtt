/* ── DM Command Center ─────────────────────────────────────────
 * Full dashboard with campaign management, quick stats,
 * live session status, quick-action navigation, and recent activity.
 *
 * UPGRADED:
 *  • Conditions & Environment status (weather, lighting, terrain)
 *  • Homebrew stats in Campaign Summary
 *  • Quick-start encounter button
 *  • Enhanced session status bar with scene preview
 * ─────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { createDemoCampaign } from "@/data/demoCampaign";
import { useState } from "react";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { ExportAllButton } from "@/components/ui/ExportAllButton";
import { Badge } from "@/components/ui/Badge";

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

  // Environment & Conditions state
  const [weather, setWeather] = useState<string>("clear");
  const [lighting, setLighting] = useState<string>("bright");
  const [terrain, setTerrain] = useState<string>("normal");

  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [showConditions, setShowConditions] = useState(false);

  const combatants = activeEncounter?.combatants ?? [];
  const aliveCount = combatants.filter((c) => !c.isDead).length;
  const deadCount = combatants.filter((c) => c.isDead).length;

  const weatherOptions = [
    { value: "clear", label: "☀️ Clear", desc: "Standard visibility" },
    { value: "cloudy", label: "☁️ Cloudy", desc: "Dim light, -2 to Perception" },
    { value: "rain", label: "🌧️ Rainy", desc: "Heavy precipitation, -5 to Perception" },
    { value: "storm", label: "⛈️ Storm", desc: "Gale winds + rain, ranged attacks disadvantage" },
    { value: "fog", label: "🌫️ Fog", desc: "Heavily obscured, blinded beyond 30ft" },
    { value: "snow", label: "❄️ Snow", desc: "Difficult terrain, -5 to Perception" },
  ];

  const lightingOptions = [
    { value: "bright", label: "☀️ Bright", desc: "Normal vision" },
    { value: "dim", label: "🌅 Dim", desc: "Disadvantage on Perception (darkvision sees normally)" },
    { value: "darkness", label: "🌑 Darkness", desc: "Heavily obscured (blinded without darkvision)" },
    { value: "magical_darkness", label: "🔮 Magical Darkness", desc: "Can't be seen through even with darkvision" },
  ];

  const terrainOptions = [
    { value: "normal", label: "🌿 Normal", desc: "Standard movement" },
    { value: "difficult", label: "🌳 Difficult", desc: "Movement costs 2x speed" },
    { value: "extreme", label: "🏔️ Extreme", desc: "Difficult terrain + climbing required" },
    { value: "water", label: "🌊 Water", desc: "Swimming, movement halved" },
    { value: "lava", label: "🌋 Lava", desc: "Fire damage per round in contact" },
  ];

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
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" color="border-l-rogue-500" />
        <StatCard label="Encounters" value={campaign.encounters.length} icon="⚡" color="border-l-warrior-500" />
        <StatCard label="Maps" value={campaign.battleMaps.length} icon="🗺️" color="border-l-mage-500" />
        <StatCard label="Journal" value={campaign.journal.length} icon="📖" color="border-l-divine-500" />
        <StatCard label="Homebrew" value={totalHomebrew} icon="⚗️" color="border-l-surface-500"
          detail={totalHomebrew > 0 ? `${homebrewItems} items · ${homebrewFeats} feats · ${homebrewSpells} spells` : undefined} />
        <StatCard label="Combat" value={combatants.length} icon="⚔️" color="border-l-accent-500"
          detail={aliveCount > 0 ? `${aliveCount} alive · ${deadCount} defeated` : undefined} />
      </section>

      {/* Session Controls + Live Status */}
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
              <button onClick={handleStartSession}
                className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:bg-accent-500 transition-colors">
                ▶ Start Session
              </button>
            ) : (
              <button onClick={handleEndSession}
                className="rounded-lg border border-warrior-500/30 px-4 py-2 text-xs font-semibold text-warrior-400 hover:bg-warrior-500/10 transition-colors">
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
              <p className="text-surface-500">Weather</p>
              <p className="font-medium text-surface-200">{weatherOptions.find((w) => w.value === weather)?.label.split(" ")[0] ?? "—"}</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions + Conditions */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {/* Quick Actions */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickActionButton label="Combat Center" icon="⚔️" to="/encounters" />
            <QuickActionButton label="New Player" icon="+" to="/players" />
            <QuickActionButton label="Homebrew" icon="⚗️" to="/homebrew" />
            <QuickActionButton label="Journal Entry" icon="📝" to="/journal" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/encounters" className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs font-medium text-warrior-400 hover:bg-warrior-500/20 transition-colors">
              ⚡ Quick-Start Encounter
            </Link>
            <Link to="/maps" className="rounded-lg bg-mage-500/10 px-3 py-2 text-xs font-medium text-mage-400 hover:bg-mage-500/20 transition-colors">
              🗺️ Create Map
            </Link>
          </div>
        </section>

        {/* Conditions & Environment Widget */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
          <button onClick={() => setShowConditions((o) => !o)}
            className="flex w-full items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">🌤️ Conditions</h3>
            <span className={`text-xs text-surface-500 transition-transform ${showConditions ? "rotate-180" : ""}`}>▼</span>
          </button>
          <div className="space-y-3">
            {/* Weather */}
            <div>
              <p className="text-[10px] font-medium text-surface-500 mb-1">Weather</p>
              <div className="flex flex-wrap gap-1">
                {weatherOptions.slice(0, showConditions ? 6 : 3).map((opt) => (
                  <button key={opt.value} onClick={() => setWeather(opt.value)}
                    className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                      weather === opt.value
                        ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                        : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                    }`} title={opt.desc}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {showConditions && (
              <>
                {/* Lighting */}
                <div>
                  <p className="text-[10px] font-medium text-surface-500 mb-1">Lighting</p>
                  <div className="flex flex-wrap gap-1">
                    {lightingOptions.map((opt) => (
                      <button key={opt.value} onClick={() => setLighting(opt.value)}
                        className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                          lighting === opt.value
                            ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                            : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                        }`} title={opt.desc}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Terrain */}
                <div>
                  <p className="text-[10px] font-medium text-surface-500 mb-1">Terrain</p>
                  <div className="flex flex-wrap gap-1">
                    {terrainOptions.map((opt) => (
                      <button key={opt.value} onClick={() => setTerrain(opt.value)}
                        className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                          terrain === opt.value
                            ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                            : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                        }`} title={opt.desc}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {!showConditions && weather !== "clear" && (
              <div className="rounded-lg bg-surface-800 p-2 text-xs flex items-center gap-2">
                <span>{weatherOptions.find((w) => w.value === weather)?.label.split(" ")[0]}</span>
                <span className="text-surface-500">{weatherOptions.find((w) => w.value === weather)?.desc}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity + Campaign Summary */}
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
      {detail && <p className="text-[11px] text-surface-500 mt-0.5">{detail}</p>}
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
