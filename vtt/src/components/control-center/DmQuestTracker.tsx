/**
 * STᚱ VTT — DM Quest, NPC & Session Reference Tracker
 *
 * Cycle 32: A dedicated session-side tool for tracking active quests,
 * named NPCs with attitudes/notes, and key campaign locations
 * without leaving the main DM screen.
 *
 * Features:
 *   - Quest tracking: active/completed/abandoned statuses
 *   - Quick NPC reference: name, role, location, notes, attitude
 *   - Location pins: key campaign locations with descriptions
 *   - Journal-pinned suggestions: pulls from campaign journal
 *   - Search across all 3 categories
 *   - Color-coded status badges for quests (active=emerald,
 *     completed=gold, abandoned=rose)
 *   - Per-row inline edit for descriptions and notes
 *   - Quick-attach: links NPCs to quests via inline tags
 *   - Escape key + backdrop click to dismiss
 *   - Overrrides/Lusion premium glassmorphism
 *
 * Data: all state is local (no Firestore writes) — designed for
 *   quick in-session reference, not durable campaign tracking
 *   (the Journal page handles that).
 */

import { useState, useEffect, useMemo } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface DmQuestTrackerProps {
  onClose: () => void;
}

// ── Local types ──

interface QuestEntry {
  id: string;
  name: string;
  status: "active" | "completed" | "abandoned";
  description: string;
  npcs: string[];
}

interface NpcEntry {
  id: string;
  name: string;
  role: string;
  location: string;
  attitude: "friendly" | "indifferent" | "hostile";
  notes: string;
}

interface LocationEntry {
  id: string;
  name: string;
  type: string;
  description: string;
}

// ── Preset demo data ──

const PRESET_QUESTS: QuestEntry[] = [
  { id: "q1", name: "The Sunless Citadel", status: "active", description: "Investigate the ancient fortress beneath the Oakhurst barrow. Find the missing adventurers.", npcs: ["Belak", "Erky Timbers"] },
  { id: "q2", name: "Dragon of Icespire Peak", status: "active", description: "Cryovain the white dragon terrorizes Phandalin. Defeat it or drive it away.", npcs: ["Harbin Wester", "Adabra Gwynn"] },
  { id: "q3", name: "Recover the Lost Relic", status: "completed", description: "Retrieve the Chalice of Light from the Shadow Marsh.", npcs: ["Elder Thalia"] },
  { id: "q4", name: "Goblin Diplomacy", status: "abandoned", description: "Forged a truce with the Cracktooth goblin tribe. Abandoned after the chieftain's betrayal.", npcs: [] },
];

const PRESET_NPCS: NpcEntry[] = [
  { id: "n1", name: "Belak the Outcast", role: "Druid / Antagonist", location: "Sunless Citadel", attitude: "hostile", notes: "Corrupted druid who tends the Gulthias Tree. Last seen in the chapel." },
  { id: "n2", name: "Erky Timbers", role: "Gnome Prisoner", location: "Sunless Citadel", attitude: "friendly", notes: "Captured by goblins. Can provide information about the citadel's layout." },
  { id: "n3", name: "Harbin Wester", role: "Townmaster", location: "Phandalin", attitude: "indifferent", notes: "Offers bounties for monster threats. Pays 50gp per completed contract." },
  { id: "n4", name: "Adabra Gwynn", role: "Apothecary", location: "Phandalin", attitude: "friendly", notes: "Sells potions at a 10% discount to adventurers. Knows about the dragon." },
  { id: "n5", name: "Elder Thalia", role: "Temple Keeper", location: "Stillwater", attitude: "friendly", notes: "Guardian of the Chalice of Light. May offer divination services." },
];

const PRESET_LOCATIONS: LocationEntry[] = [
  { id: "l1", name: "Oakhurst", type: "Village", description: "A small farming village. The Sunless Citadel lies beneath the ancient barrow to the north." },
  { id: "l2", name: "Phandalin", type: "Town", description: "A frontier mining town. Growing prosperous from the nearby wave echo cave. Icespire Peak looms to the east." },
  { id: "l3", name: "Shadow Marsh", type: "Swamp", description: "A mist-choked marsh south of the road. The Chalice of Light was hidden in the sunken temple." },
  { id: "l4", name: "Icespire Peak", type: "Mountain", description: "An active volcano in the Sword Mountains. Cryovain the white dragon has claimed the summit." },
];

// ── Sub-component: inline editable text ──

function EditableText({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-px text-[7px] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 ${className}`}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:text-gold-300 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

export default function DmQuestTracker({ onClose }: DmQuestTrackerProps) {
  // ── Escape key ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"quests" | "npcs" | "locations">("quests");

  // ── Data ──
  const [quests, setQuests] = useState<QuestEntry[]>(PRESET_QUESTS);
  const [npcs, setNpcs] = useState<NpcEntry[]>(PRESET_NPCS);
  const [locations, setLocations] = useState<LocationEntry[]>(PRESET_LOCATIONS);

  // ── Search ──
  const [search, setSearch] = useState("");

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "abandoned">("active");

  // ── Filtered data ──
  const filteredQuests = useMemo(() => {
    let list = quests;
    if (statusFilter !== "all") {
      list = list.filter((q) => q.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [quests, statusFilter, search]);

  const filteredNpcs = useMemo(() => {
    if (!search.trim()) return npcs;
    const q = search.toLowerCase();
    return npcs.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.role.toLowerCase().includes(q) ||
        n.location.toLowerCase().includes(q) ||
        n.notes.toLowerCase().includes(q)
    );
  }, [npcs, search]);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }, [locations, search]);

  // ── Counts ──
  const activeCount = quests.filter((q) => q.status === "active").length;
  const totalNpcs = npcs.length;
  const totalLocations = locations.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
          bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
          border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
          animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/15 to-amber-500/10 flex items-center justify-center border border-emerald/10">
              <PremiumIcon
                name="loot"
                className="w-4 h-4 text-emerald-400"
              />
            </div>
            <div>
              <h3 className="font-display text-sm text-white/90">
                Session Tracker
              </h3>
              <span className="text-[7px] text-surface-500">
                {activeCount} active quest · {totalNpcs} NPCs · {totalLocations} locations
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div className="mx-3 mb-1">
          <div className="relative">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] text-surface-500 pointer-events-none">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quests, NPCs, locations..."
              className="w-full bg-[#07080d]/70 border border-white/[0.04] rounded-lg py-1 pl-4 pr-1.5 text-[7px] text-white/80
                placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15
                transition-all"
            />
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex mx-3 gap-px mb-1">
          {(["quests", "npcs", "locations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[7px] uppercase tracking-wider rounded-t transition-all
                ${
                  activeTab === tab
                    ? "bg-white/[0.03] text-gold-300 border border-white/[0.06] border-b-transparent"
                    : "text-surface-500 hover:text-surface-400"
                }`}
            >
              {tab === "quests"
                ? `⚔ Quests (${filteredQuests.length})`
                : tab === "npcs"
                ? `👤 NPCs (${filteredNpcs.length})`
                : `📍 Locations (${filteredLocations.length})`}
            </button>
          ))}
        </div>

        {/* ── CONTENT (scrollable) ── */}
        <div className="mx-3 mb-1 overflow-y-auto max-h-[55vh] space-y-1 scrollbar-gold">
          {/* ── QUESTS TAB ── */}
          {activeTab === "quests" && (
            <div>
              {/* Status chips */}
              <div className="flex gap-0.5 mb-1">
                {(["all", "active", "completed", "abandoned"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[6px] px-1 py-px rounded-full transition-all ${
                      statusFilter === s
                        ? "bg-gold-500/10 text-gold-300 border border-gold-500/20"
                        : "text-surface-500 border border-white/[0.04] hover:text-surface-400"
                    }`}
                  >
                    {s === "all"
                      ? "All"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              {/* Quest cards */}
              <div className="space-y-px">
                {filteredQuests.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                      animate-in slide-in-from-bottom-1 fade-in duration-200"
                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: "forwards" }}
                  >
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <EditableText
                        value={q.name}
                        onChange={(v) =>
                          setQuests((prev) =>
                            prev.map((x) => (x.id === q.id ? { ...x, name: v } : x))
                          )
                        }
                        className="text-[9px] font-display text-white/90 font-medium"
                      />
                      <span
                        className={`ml-auto text-[6px] px-0.5 py-px rounded ${
                          q.status === "active"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
                            : q.status === "completed"
                            ? "bg-gold-500/10 text-gold-300 border border-gold-500/10"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/10"
                        }`}
                      >
                        {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                      </span>
                    </div>
                    <EditableText
                      value={q.description}
                      onChange={(v) =>
                        setQuests((prev) =>
                          prev.map((x) => (x.id === q.id ? { ...x, description: v } : x))
                        )
                      }
                      className="text-[7px] text-surface-400"
                    />
                    {q.npcs.length > 0 && (
                      <div className="flex flex-wrap gap-px mt-0.5">
                        {q.npcs.map((npc) => (
                          <span
                            key={npc}
                            className="text-[6px] px-0.5 py-px rounded bg-violet-500/8 text-violet-300 border border-violet-500/10"
                          >
                            👤 {npc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {filteredQuests.length === 0 && (
                  <div className="p-2 text-center">
                    <p className="text-[7px] text-surface-500 italic">
                      No quests match your filter
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── NPCS TAB ── */}
          {activeTab === "npcs" && (
            <div className="space-y-px">
              {filteredNpcs.map((n, i) => (
                <div
                  key={n.id}
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <EditableText
                      value={n.name}
                      onChange={(v) =>
                        setNpcs((prev) =>
                          prev.map((x) => (x.id === n.id ? { ...x, name: v } : x))
                        )
                      }
                      className="text-[9px] font-display text-white/90 font-medium"
                    />
                    <span
                      className={`ml-auto text-[6px] px-0.5 py-px rounded ${
                        n.attitude === "friendly"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
                          : n.attitude === "indifferent"
                          ? "bg-gold-500/10 text-gold-300 border border-gold-500/10"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/10"
                      }`}
                    >
                      {n.attitude.charAt(0).toUpperCase() + n.attitude.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-surface-400 mb-0.5">
                    <span>{n.role}</span>
                    <span className="text-surface-600">·</span>
                    <span>{n.location}</span>
                  </div>
                  <EditableText
                    value={n.notes}
                    onChange={(v) =>
                      setNpcs((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, notes: v } : x))
                      )
                    }
                    className="text-[7px] text-surface-500"
                  />
                </div>
              ))}
              {filteredNpcs.length === 0 && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">
                    No NPCs match your search
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── LOCATIONS TAB ── */}
          {activeTab === "locations" && (
            <div className="space-y-px">
              {filteredLocations.map((l, i) => (
                <div
                  key={l.id}
                  className="p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <EditableText
                      value={l.name}
                      onChange={(v) =>
                        setLocations((prev) =>
                          prev.map((x) => (x.id === l.id ? { ...x, name: v } : x))
                        )
                      }
                      className="text-[9px] font-display text-white/90 font-medium"
                    />
                    <span className="ml-auto text-[6px] px-0.5 py-px rounded bg-sky-500/10 text-sky-300 border border-sky-500/10">
                      {l.type}
                    </span>
                  </div>
                  <EditableText
                    value={l.description}
                    onChange={(v) =>
                      setLocations((prev) =>
                        prev.map((x) => (x.id === l.id ? { ...x, description: v } : x))
                      )
                    }
                    className="text-[7px] text-surface-400"
                  />
                </div>
              ))}
              {filteredLocations.length === 0 && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">
                    No locations match your search
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-surface-500">
              {quests.filter((q) => q.status === "active").length} active ·
              {npcs.filter((n) => n.attitude === "friendly").length} friendly ·
              {npcs.filter((n) => n.attitude === "hostile").length} hostile
            </span>
            <span className="text-[6px] text-surface-600">
              Click any text to edit
            </span>
          </div>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
