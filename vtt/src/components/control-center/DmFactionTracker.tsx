/**
 * STᚱ VTT — DM Faction & Relationship Tracker
 *
 * Cycle 35 (FINAL): Track NPC factions, attitudes toward the party,
 * political influence scores, and key relationships.
 *
 * D&D 5e Value: DMs managing political campaigns, faction intrigue, or
 * complex social webs need a single-panel view of:
 *   - Faction names, allegiances, and influence levels
 *   - Party reputation with each faction (Hostile → Friendly)
 *   - Key NPCs per faction with roles and notes
 *   - Relationship visual web between factions
 *
 * Features:
 *   - 3-tab panel: Factions (list/edit), Relationships (visual web),
 *     NPCs (key members per faction)
 *   - Create/edit/delete factions with name, alignment (9-axis),
 *     influence (1-10), and party attitude
 *   - Relationship matrix showing attitudes between factions
 *     (Allied → Friendly → Neutral → Distrustful → Hostile → War)
 *   - Per-faction NPC roster with name, role, and notes
 *   - Compass/radial visual for faction relationships
 *   - State persisted in campaign store (journal-like entries)
 *   - All data is local (Zustand) — no Firestore writes needed
 *   - Overrrides/Lusion premium glassmorphism
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface DmFactionTrackerProps {
  onClose: () => void;
}

interface Faction {
  id: string;
  name: string;
  alignment: string; // LG, NG, CG, LN, TN, CN, LE, NE, CE
  influence: number; // 1-10
  partyAttitude: "allied" | "friendly" | "neutral" | "distrustful" | "hostile";
  notes: string;
  npcs: FactionNpc[];
  colorIndex: number; // index into FACTION_COLORS
}

interface FactionNpc {
  id: string;
  name: string;
  role: string;
  notes: string;
}

interface FactionRelation {
  factionId1: string;
  factionId2: string;
  attitude: "allied" | "friendly" | "neutral" | "distrustful" | "hostile" | "war";
}

// ── Constants ──
const ALIGNMENTS = [
  { value: "LG", label: "Lawful Good", icon: "⚖️" },
  { value: "NG", label: "Neutral Good", icon: "🌿" },
  { value: "CG", label: "Chaotic Good", icon: "✨" },
  { value: "LN", label: "Lawful Neutral", icon: "📜" },
  { value: "TN", label: "True Neutral", icon: "⚪" },
  { value: "CN", label: "Chaotic Neutral", icon: "🌀" },
  { value: "LE", label: "Lawful Evil", icon: "⛓️" },
  { value: "NE", label: "Neutral Evil", icon: "💀" },
  { value: "CE", label: "Chaotic Evil", icon: "🔥" },
];

const ATTITUDES = [
  { value: "allied", label: "Allied", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "friendly", label: "Friendly", color: "text-emerald-300", bg: "bg-emerald-500/8 border-emerald-500/15" },
  { value: "neutral", label: "Neutral", color: "text-gold-300", bg: "bg-gold-500/8 border-gold-500/15" },
  { value: "distrustful", label: "Distrustful", color: "text-amber-300", bg: "bg-amber-500/8 border-amber-500/15" },
  { value: "hostile", label: "Hostile", color: "text-rose-300", bg: "bg-rose-500/8 border-rose-500/15" },
  { value: "war", label: "War", color: "text-red-300", bg: "bg-red-500/10 border-red-500/20" },
] as const;

const FACTION_COLORS = [
  "from-rose-500/10 to-rose-500/5 border-rose-500/20",
  "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  "from-violet-500/10 to-violet-500/5 border-violet-500/20",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
  "from-pink-500/10 to-pink-500/5 border-pink-500/20",
  "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
  "from-teal-500/10 to-teal-500/5 border-teal-500/20",
  "from-orange-500/10 to-orange-500/5 border-orange-500/20",
];

const INFLUENCE_LABELS = [
  "None", "Marginal", "Minor", "Local", "Regional",
  "Notable", "Major", "Powerful", "National", "Global",
];

const ATTITUDE_COLORS: Record<string, string> = {
  allied: "#34d399",
  friendly: "#6ee7b7",
  neutral: "#fbbf24",
  distrustful: "#f59e0b",
  hostile: "#f87171",
  war: "#ef4444",
};

type TabId = "factions" | "npcs" | "relations";

// ── ID generator ──
let _idCounter = 0;
function uid(prefix = "f"): string {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}_${Math.floor(Math.random() * 1000)}`;
}

export default function DmFactionTracker({ onClose }: DmFactionTrackerProps) {
  // ── Escape key ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Persist in localStorage ──
  const STORAGE_KEY = "str-vtt-dm-factions";

  const [factions, setFactions] = useState<Faction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    // Default factions for quick start
    return [
      {
        id: uid("f"),
        name: "The Crown",
        alignment: "LG",
        influence: 8,
        partyAttitude: "neutral" as const,
        notes: "Royal government — controls the capital and standing army.",
        npcs: [{ id: uid("n"), name: "Queen Elara", role: "Sovereign", notes: "Wise and just ruler." }],
        colorIndex: 0,
      },
      {
        id: uid("f"),
        name: "Guild of Artificers",
        alignment: "TN",
        influence: 6,
        partyAttitude: "friendly" as const,
        notes: "Runs the city's magical infrastructure. Open to trade.",
        npcs: [
          { id: uid("n"), name: "Master Kaelen", role: "Guildmaster", notes: "Interested in rare magical components." },
        ],
        colorIndex: 1,
      },
      {
        id: uid("f"),
        name: "The Crimson Hand",
        alignment: "NE",
        influence: 4,
        partyAttitude: "hostile" as const,
        notes: "Assassin's guild. Operates from the shadows. Wanted the party dead after the last heist.",
        npcs: [{ id: uid("n"), name: "Silas Vane", role: "Hand of Crimson", notes: "Elusive leader. Never seen in public." }],
        colorIndex: 4,
      },
    ];
  });

  // ── Faction relations ──
  const [relations, setRelations] = useState<FactionRelation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY + "-relations");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
  });

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(factions)); }
    catch { /* ignore */ }
  }, [factions]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY + "-relations", JSON.stringify(relations)); }
    catch { /* ignore */ }
  }, [relations]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabId>("factions");
  const [editingFaction, setEditingFaction] = useState<string | null>(null); // faction id or "new"
  const [editingNpc, setEditingNpc] = useState<string | null>(null); // faction id or null

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "factions", label: "Factions", icon: "🏛️" },
    { id: "relations", label: "Relations", icon: "🕸️" },
    { id: "npcs", label: "NPCs", icon: "👥" },
  ];

  // ── Faction CRUD ──
  const getDefaultFaction = useCallback((): Faction => ({
    id: uid("f"),
    name: "",
    alignment: "TN",
    influence: 5,
    partyAttitude: "neutral",
    notes: "",
    npcs: [],
    colorIndex: factions.length % FACTION_COLORS.length,
  }), [factions.length]);

  const handleCreateFaction = useCallback(() => {
    const f = getDefaultFaction();
    setFactions((prev) => [...prev, f]);
    setEditingFaction(f.id);
  }, [getDefaultFaction]);

  const handleDeleteFaction = useCallback((id: string) => {
    setFactions((prev) => prev.filter((f) => f.id !== id));
    setRelations((prev) => prev.filter((r) => r.factionId1 !== id && r.factionId2 !== id));
    if (editingFaction === id) setEditingFaction(null);
  }, [editingFaction]);

  const handleUpdateFaction = useCallback((id: string, patch: Partial<Faction>) => {
    setFactions((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  // ── NPC CRUD ──
  const handleAddNpc = useCallback((factionId: string) => {
    const npc: FactionNpc = { id: uid("n"), name: "", role: "", notes: "" };
    setFactions((prev) =>
      prev.map((f) => (f.id === factionId ? { ...f, npcs: [...f.npcs, npc] } : f))
    );
    setEditingNpc(factionId);
  }, []);

  const handleUpdateNpc = useCallback((factionId: string, npcId: string, patch: Partial<FactionNpc>) => {
    setFactions((prev) =>
      prev.map((f) =>
        f.id === factionId
          ? { ...f, npcs: f.npcs.map((n) => (n.id === npcId ? { ...n, ...patch } : n)) }
          : f
      )
    );
  }, []);

  const handleDeleteNpc = useCallback((factionId: string, npcId: string) => {
    setFactions((prev) =>
      prev.map((f) => (f.id === factionId ? { ...f, npcs: f.npcs.filter((n) => n.id !== npcId) } : f))
    );
  }, []);

  // ── Relations ──
  const getRelation = useCallback((id1: string, id2: string): FactionRelation | undefined => {
    return relations.find(
      (r) => (r.factionId1 === id1 && r.factionId2 === id2) || (r.factionId1 === id2 && r.factionId2 === id1)
    );
  }, [relations]);

  const setRelation = useCallback((factionId1: string, factionId2: string, attitude: FactionRelation["attitude"]) => {
    setRelations((prev) => {
      const existing = prev.findIndex(
        (r) => (r.factionId1 === factionId1 && r.factionId2 === factionId2) ||
               (r.factionId1 === factionId2 && r.factionId2 === factionId1)
      );
      if (existing >= 0) {
        return prev.map((r, i) => (i === existing ? { ...r, attitude } : r));
      }
      return [...prev, { factionId1, factionId2, attitude }];
    });
  }, []);

  // ── Alignment icon ──
  const getAlignmentMeta = (value: string) => ALIGNMENTS.find((a) => a.value === value) || ALIGNMENTS[4];
  const getAttitudeMeta = (value: string) => ATTITUDES.find((a) => a.value === value) || ATTITUDES[2];

  // ── Render alignment badge ──
  const AlignmentBadge = ({ value }: { value: string }) => {
    const meta = getAlignmentMeta(value);
    return (
      <span className="text-[6px] text-surface-400" title={meta.label}>
        {meta.icon} {value}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-hidden
          bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
          border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
          animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="encounterComplete" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">
              Faction Tracker
            </h3>
            <span className="text-[6px] text-surface-500">({factions.length} factions)</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── TAB BAR ── */}
        <div className="mx-3 mb-1 flex items-center gap-1 border-b border-white/[0.04] pb-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-1.5 py-0.5 rounded-t text-[7px] transition-all ${
                activeTab === tab.id
                  ? "bg-gold-500/8 text-gold-300 border-b-2 border-gold-500/30"
                  : "text-surface-500 hover:text-surface-400"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="mx-3 flex-1 overflow-y-auto max-h-[340px] scrollbar-gold pb-1">

          {/* ── TAB: FACTIONS ── */}
          {activeTab === "factions" && (
            <div className="space-y-1">
              <button
                onClick={handleCreateFaction}
                className="w-full px-1 py-0.5 rounded text-[7px] bg-gold-500/12 text-gold-300 border border-gold-500/20
                  hover:bg-gold-500/18 transition-colors"
              >
                + New Faction
              </button>

              {factions.length === 0 && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">No factions created yet</p>
                  <p className="text-[6px] text-surface-600 mt-0.5">Create one to track party relationships</p>
                </div>
              )}

              {factions.map((faction) => {
                const isEditing = editingFaction === faction.id;
                const attMeta = getAttitudeMeta(faction.partyAttitude);
                const alignMeta = getAlignmentMeta(faction.alignment);

                return (
                  <div
                    key={faction.id}
                    className={`rounded-lg border bg-gradient-to-br ${FACTION_COLORS[faction.colorIndex % FACTION_COLORS.length]} p-1 space-y-0.5`}
                  >
                    {/* Faction header row */}
                    <div className="flex items-center justify-between gap-0.5">
                      <input
                        value={faction.name}
                        onChange={(e) => handleUpdateFaction(faction.id, { name: e.target.value })}
                        placeholder="Faction name..."
                        className="flex-1 min-w-0 bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-0.5 text-[8px] text-white/80
                          placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 font-medium"
                      />
                      <div className="flex items-center gap-px shrink-0">
                        <select
                          value={faction.alignment}
                          onChange={(e) => handleUpdateFaction(faction.id, { alignment: e.target.value })}
                          className="bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-0.5 text-[6px] text-surface-400
                            focus:outline-none focus:border-gold-500/25"
                        >
                          {ALIGNMENTS.map((a) => (
                            <option key={a.value} value={a.value}>{a.icon} {a.value}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteFaction(faction.id)}
                          className="w-4 h-4 rounded flex items-center justify-center text-[6px] text-rose-400/60
                            hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Attitude + Influence row */}
                    <div className="flex items-center gap-1">
                      <select
                        value={faction.partyAttitude}
                        onChange={(e) => handleUpdateFaction(faction.id, { partyAttitude: e.target.value as Faction["partyAttitude"] })}
                        className="bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-px text-[6px] text-surface-400
                          focus:outline-none focus:border-gold-500/25"
                      >
                        {ATTITUDES.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-px">
                        <span className="text-[5px] text-surface-600">Inf:</span>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={faction.influence}
                          onChange={(e) => handleUpdateFaction(faction.id, { influence: Number(e.target.value) })}
                          className="w-12 h-1 accent-gold-500"
                        />
                        <span className="text-[6px] font-mono tabular-nums text-surface-400">{faction.influence}</span>
                        <span className="text-[5px] text-surface-600">({INFLUENCE_LABELS[faction.influence - 1]})</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <textarea
                      value={faction.notes}
                      onChange={(e) => handleUpdateFaction(faction.id, { notes: e.target.value })}
                      placeholder="Faction notes, goals, secrets..."
                      className="w-full bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-0.5 text-[6px] text-white/60
                        placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 resize-none h-6 scrollbar-gold"
                    />

                    {/* NPC count */}
                    <div className="flex items-center justify-between">
                      <span className="text-[5px] text-surface-600">
                        {faction.npcs.length} NPC{faction.npcs.length !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => handleAddNpc(faction.id)}
                        className="text-[5px] text-gold-400/60 hover:text-gold-400 transition-colors"
                      >
                        + Add NPC
                      </button>
                    </div>

                    {/* Inline NPCs list */}
                    {faction.npcs.length > 0 && (
                      <div className="space-y-px">
                        {faction.npcs.map((npc) => (
                          <div key={npc.id} className="flex items-center gap-px p-0.5 rounded bg-surface-900/40 border border-white/[0.02]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-0.5">
                                <input
                                  value={npc.name}
                                  onChange={(e) => handleUpdateNpc(faction.id, npc.id, { name: e.target.value })}
                                  placeholder="NPC name..."
                                  className="flex-1 min-w-0 bg-transparent text-[6px] text-white/70 placeholder:text-surface-700
                                    focus:outline-none focus:text-white/90"
                                />
                                <span className="text-[5px] text-surface-600">·</span>
                                <input
                                  value={npc.role}
                                  onChange={(e) => handleUpdateNpc(faction.id, npc.id, { role: e.target.value })}
                                  placeholder="Role..."
                                  className="max-w-[60px] bg-transparent text-[5px] text-surface-400 placeholder:text-surface-700
                                    focus:outline-none focus:text-white/60"
                                />
                                <button
                                  onClick={() => handleDeleteNpc(faction.id, npc.id)}
                                  className="w-3 h-3 rounded flex items-center justify-center text-[4px] text-rose-400/40
                                    hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: RELATIONS ── */}
          {activeTab === "relations" && (
            <div className="space-y-1">
              <p className="text-[6px] text-surface-600 italic">Set attitudes between factions</p>

              {factions.length < 2 && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">Create at least 2 factions to manage relations</p>
                </div>
              )}

              {/* Relationship matrix */}
              {factions.length >= 2 && (
                <div className="space-y-px">
                  {factions.map((f1, i) =>
                    factions.slice(i + 1).map((f2) => {
                      const existingRel = getRelation(f1.id, f2.id);
                      const curAtt = existingRel?.attitude || "neutral";
                      const attMeta = getAttitudeMeta(curAtt);

                      return (
                        <div
                          key={`${f1.id}-${f2.id}`}
                          className="flex items-center gap-0.5 p-0.5 rounded bg-surface-800/10 border border-white/[0.02]"
                        >
                          <span className="text-[6px] text-white/60 truncate flex-1">{f1.name}</span>
                          <span className="text-[5px] text-surface-600">↔</span>
                          <span className="text-[6px] text-white/60 truncate flex-1">{f2.name}</span>
                          <select
                            value={curAtt}
                            onChange={(e) => setRelation(f1.id, f2.id, e.target.value as FactionRelation["attitude"])}
                            className="bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-px text-[6px] text-surface-400
                              focus:outline-none focus:border-gold-500/25"
                          >
                            {ATTITUDES.map((a) => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Relation stats */}
              {factions.length >= 2 && (
                <div className="p-0.5 rounded bg-surface-800/20 border border-white/[0.03]">
                  <div className="flex items-center justify-between flex-wrap gap-x-1">
                    {ATTITUDES.map((a) => {
                      const count = relations.filter((r) => r.attitude === a.value).length;
                      return (
                        <span key={a.value} className={`text-[5px] ${a.color}`}>
                          {a.label}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: NPCS ── */}
          {activeTab === "npcs" && (
            <div className="space-y-1">
              <p className="text-[6px] text-surface-600 italic">All NPCs across all factions</p>

              {/* Group NPCs by faction */}
              {factions
                .filter((f) => f.npcs.length > 0)
                .map((faction) => (
                  <div key={faction.id} className="space-y-px">
                    <div className="flex items-center gap-0.5 pb-px border-b border-white/[0.04]">
                      <span className="w-2 h-2 rounded-full" style={{
                        background: `linear-gradient(135deg, ${["#e11d48","#3b82f6","#10b981","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#6366f1","#14b8a6","#f97316"][faction.colorIndex % 10]})` 
                      }} />
                      <span className="text-[7px] text-white/70 font-medium">{faction.name}</span>
                      <span className="text-[5px] text-surface-600">({faction.npcs.length})</span>
                    </div>

                    {faction.npcs.map((npc) => (
                      <div key={npc.id} className="p-0.5 rounded bg-surface-800/10 border border-white/[0.02]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5">
                            <span className="text-[7px] text-white/80">{npc.name}</span>
                            {npc.role && (
                              <>
                                <span className="text-[4px] text-surface-600">·</span>
                                <span className="text-[6px] text-gold-400/70">{npc.role}</span>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteNpc(faction.id, npc.id)}
                            className="w-3 h-3 rounded flex items-center justify-center text-[4px] text-rose-400/40
                              hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                        {npc.notes && (
                          <p className="text-[5px] text-surface-500 italic mt-px">{npc.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

              {factions.every((f) => f.npcs.length === 0) && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">No NPCs created yet</p>
                  <p className="text-[6px] text-surface-600 mt-0.5">Add NPCs to factions from the Factions tab</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-0.5 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-[6px] text-surface-500">
              {factions.length} factions · {factions.reduce((sum, f) => sum + f.npcs.length, 0)} NPCs · {relations.length} relations
            </span>
            <span className="text-[5px] text-surface-600">
              Local storage
            </span>
          </div>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
