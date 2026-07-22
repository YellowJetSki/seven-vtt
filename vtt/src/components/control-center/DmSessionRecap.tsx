/**
 * STᚱ VTT — DM Session Recap Generator
 *
 * Cycle 34: Auto-generates structured session summaries from combat
 * activity, XP awards, journal entries, and condition logs.
 *
 * D&D 5e Value: After each session, DMs need to record:
 *   - What happened (narrative beats)
 *   - Who fought what (combat encounters)
 *   - What loot/XP was awarded
 *   - What level-ups occurred
 *   - Key NPC interactions
 *
 * Features:
 *   - 3-tab panel: Narrative (manual notes), Combat Log (auto-populated
 *     from combat store), Wrap-Up (XP, loot, conditions summary)
 *   - Free-form narrative editor with auto-timestamp
 *   - Combat encounter summary derived from active encounter state
 *   - Post-combat wrap-up data (XP, loot, conditions cleared)
 *   - "Copy to Clipboard" formatted recap
 *   - "Save to Journal" button → creates journal entry
 *   - Clear Session button to reset between sessions
 *   - Overrrides/Lusion premium glassmorphism
 *
 * Data Sources: Reads campaign store (characters, XP, conditions),
 *   combat store (encounter data, rounds, kills/deaths).
 *   Does NOT write to Firestore unless "Save to Journal" is used.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";

interface DmSessionRecapProps {
  onClose: () => void;
}

// ── Tab config ──
type TabId = "narrative" | "combat" | "wrapup";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "narrative", label: "Narrative", icon: "📝" },
  { id: "combat", label: "Combat Log", icon: "⚔️" },
  { id: "wrapup", label: "Wrap-Up", icon: "🏆" },
];

// ── Format helpers ──
function formatDateTime(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function DmSessionRecap({ onClose }: DmSessionRecapProps) {
  // ── Escape key ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Stores ──
  const characters = useCampaignStore((s) => s.characters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);

  const encounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);

  // ── State ──
  const [activeTab, setActiveTab] = useState<TabId>("narrative");
  const [notes, setNotes] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Derive data ──
  // Narrative: auto-timestamp
  const sessionDate = formatDateTime();

  // Combat: from encounter + combat log
  const totalRounds = encounter?.round ?? 0;
  const totalKills = combatLog.filter((e) => e.type === "death").length;
  const totalDeaths = combatLog.filter((e) => e.type === "revive").length; // Not perfect but approximate
  const partySize = characters.length;
  const mapCount = battleMaps.length;
  const journalCount = journal.length;
  const totalXP = characters.reduce((sum, c) => sum + (c.experiencePoints || 0), 0);

  // Log entries by type
  const damageEntries = combatLog.filter((e) => e.type === "damage" || e.type === "aoe");
  const healEntries = combatLog.filter((e) => e.type === "heal");
  const conditionEntries = combatLog.filter((e) => e.type === "status" || e.type === "condition");

  // ── Build recap text ──
  const buildRecap = useCallback(() => {
    const lines: string[] = [];
    lines.push(`# Session Recap — ${sessionTitle || "Untitled Session"}`);
    lines.push(`**Date:** ${sessionDate}`);
    lines.push(`**Party:** ${partySize} adventurers`);
    lines.push(`**Maps Used:** ${mapCount} · **Journal Entries:** ${journalCount}`);
    lines.push("");

    // Narrative
    if (notes.trim()) {
      lines.push("## Narrative Summary");
      lines.push(notes.trim());
      lines.push("");
    }

    // Combat
    lines.push("## Combat Summary");
    lines.push(`**Total Rounds:** ${totalRounds}`);
    lines.push(`**Kills:** ${totalKills} · **Deaths/Revives:** ${totalDeaths}`);
    lines.push(`**Damage Events:** ${damageEntries.length}`);
    lines.push(`**Healing Events:** ${healEntries.length}`);
    lines.push(`**Status/Condition Changes:** ${conditionEntries.length}`);
    lines.push("");

    // Party
    lines.push("## Party Status");
    for (const c of characters) {
      const hp = c.hitPoints;
      lines.push(`- **${c.name}** (${c.race} ${c.class} ${c.level}) — HP: ${hp?.current ?? "?"}/${hp?.max ?? "?"}`);
    }
    lines.push("");

    // Wrap-up
    lines.push("## Session Wrap-Up");
    lines.push(`**Total Party XP:** ${totalXP.toLocaleString()}`);
    lines.push("");
    lines.push("---");
    lines.push(`*Generated by Arkla — ${sessionDate}*`);

    return lines.join("\n");
  }, [sessionTitle, sessionDate, partySize, mapCount, journalCount, notes, totalRounds, totalKills, totalDeaths, damageEntries.length, healEntries.length, conditionEntries.length, characters, totalXP]);

  // ── Save to Journal ──
  const handleSaveToJournal = useCallback(async () => {
    setSaving(true);
    try {
      const recapText = buildRecap();
      addJournalEntry({
        id: `recap_${Date.now()}`,
        title: sessionTitle.trim() || `Session Recap — ${sessionDate}`,
        content: recapText,
        type: "session",
        tags: ["session-recap", "auto-generated"],
        sessionNumber: journal.filter((e) => e.type === "session").length + 1,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, [buildRecap, sessionTitle, sessionDate, addJournalEntry, journal]);

  // ── Copy to Clipboard ──
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildRecap());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [buildRecap]);

  // ── Clear session ──
  const handleClear = useCallback(() => {
    setNotes("");
    setSessionTitle("");
    setSaved(false);
  }, []);

  // ── Combat log display ──
  const recentLogs = combatLog.slice(-20).reverse();

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
              Session Recap
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Session title ── */}
        <div className="mx-3 mb-1">
          <input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session title..."
            className="w-full bg-[#07080d]/70 border border-white/[0.04] rounded px-1 py-0.5 text-[9px] text-white/80
              placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15
              transition-all"
          />
        </div>

        {/* ── Stats bar ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-center gap-2 text-[6px] text-surface-500">
            <span>{sessionDate}</span>
            <span className="text-surface-600">·</span>
            <span>{partySize} PCs</span>
            <span className="text-surface-600">·</span>
            <span>{totalRounds} rounds</span>
            <span className="text-surface-600">·</span>
            <span>{totalKills} kills</span>
          </div>
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
        <div className="mx-3 flex-1 overflow-y-auto max-h-[320px] scrollbar-gold">
          {/* Narrative Tab */}
          {activeTab === "narrative" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-surface-500">Session notes</span>
                <span className="text-[6px] text-surface-600">{notes.length} chars</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What happened this session? Key NPC interactions, player decisions, story beats..."
                className="w-full h-28 bg-[#07080d]/70 border border-white/[0.04] rounded px-1 py-0.5 text-[7px] text-white/70
                  placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15
                  resize-none transition-all scrollbar-gold"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSaveToJournal}
                  disabled={saving || saved}
                  className={`flex-1 px-1 py-0.5 rounded text-[7px] transition-all ${
                    saved
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-gold-500/12 text-gold-300 border border-gold-500/20 hover:bg-gold-500/18"
                  }`}
                >
                  {saved ? "✅ Saved!" : saving ? "⏳ Saving..." : "💾 Save to Journal"}
                </button>
                <button
                  onClick={handleCopy}
                  className={`px-1 py-0.5 rounded text-[7px] transition-all ${
                    copied
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-surface-800/40 text-surface-400 border border-white/[0.04] hover:text-white/60"
                  }`}
                >
                  {copied ? "✅ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Combat Log Tab */}
          {activeTab === "combat" && (
            <div className="space-y-px">
              <div className="flex items-center justify-between">
                <span className="text-[7px] text-surface-500">Recent actions</span>
                <span className="text-[6px] text-surface-600">{combatLog.length} total</span>
              </div>
              {recentLogs.length === 0 && (
                <div className="p-2 text-center">
                  <p className="text-[7px] text-surface-500 italic">No combat actions recorded</p>
                </div>
              )}
              {recentLogs.map((entry, i) => {
                // Determine icon and color from entry type
                const typeMeta: Record<string, { icon: string; color: string }> = {
                  damage: { icon: "💥", color: "text-rose-300" },
                  heal: { icon: "❤️", color: "text-emerald-300" },
                  death: { icon: "💀", color: "text-rose-400" },
                  revive: { icon: "✨", color: "text-emerald-300" },
                  status: { icon: "⚡", color: "text-amber-300" },
                  condition: { icon: "⚡", color: "text-amber-300" },
                  aoe: { icon: "🔥", color: "text-rose-300" },
                  turn_change: { icon: "🔄", color: "text-gold-300" },
                  note: { icon: "📝", color: "text-surface-400" },
                };
                const meta = typeMeta[entry.type] || { icon: "📝", color: "text-surface-400" };

                return (
                  <div
                    key={`${entry.timestamp}-${i}`}
                    className="flex items-center gap-0.5 p-0.5 rounded bg-surface-800/10 border border-white/[0.02]"
                  >
                    <span className="text-[8px]">{meta.icon}</span>
                    <span className={`text-[6px] ${meta.color} truncate flex-1`}>
                      {entry.description || entry.actorName || "Unknown action"}
                    </span>
                    <span className="text-[5px] text-surface-700 shrink-0">
                      {entry.value != null && entry.value !== 0 ? `${entry.value > 0 ? "+" : ""}${entry.value}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wrap-Up Tab */}
          {activeTab === "wrapup" && (
            <div className="space-y-1">
              <span className="text-[7px] text-surface-500">Session wrap-up summary</span>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-px">
                {[
                  { label: "Rounds", value: totalRounds, color: "text-gold-300" },
                  { label: "Kills", value: totalKills, color: "text-rose-300" },
                  { label: "Revives", value: totalDeaths, color: "text-emerald-300" },
                  { label: "Damage Evt", value: damageEntries.length, color: "text-rose-400" },
                  { label: "Heal Evt", value: healEntries.length, color: "text-emerald-400" },
                  { label: "Status Chg", value: conditionEntries.length, color: "text-amber-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-0.5 rounded bg-surface-800/20 border border-white/[0.03] text-center"
                  >
                    <div className={`text-[10px] font-mono tabular-nums ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-[5px] text-surface-600 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Party status */}
              <span className="text-[7px] text-surface-500">Party Status</span>
              {characters.map((c, i) => {
                const hp = c.hitPoints;
                const ratio = hp && hp.max > 0 ? (hp.current ?? 0) / hp.max : 1;
                const barColor =
                  ratio <= 0 ? "bg-rose-500" :
                  ratio <= 0.25 ? "bg-red-500" :
                  ratio <= 0.5 ? "bg-amber-500" :
                  ratio <= 0.75 ? "bg-gold-500" :
                  "bg-emerald-500";
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-0.5 p-0.5 rounded bg-surface-800/10 border border-white/[0.02]"
                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: "forwards" }}
                  >
                    <span className="w-4 h-4 rounded-full bg-surface-800/60 flex items-center justify-center text-[6px] text-white/60 shrink-0">
                      {c.name?.[0] || "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[6px] text-white/70 truncate">{c.name}</span>
                        <span className="text-[6px] font-mono tabular-nums text-white/50">
                          {hp?.current ?? "?"}/{hp?.max ?? "?"}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-surface-900/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total XP */}
              <div className="p-0.5 rounded bg-surface-800/20 border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] text-surface-500">Total Party XP</span>
                  <span className="text-[9px] font-mono tabular-nums text-gold-400">
                    {totalXP.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Wrap-Up actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSaveToJournal}
                  disabled={saving || saved}
                  className={`flex-1 px-1 py-0.5 rounded text-[7px] transition-all ${
                    saved
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-gold-500/12 text-gold-300 border border-gold-500/20 hover:bg-gold-500/18"
                  }`}
                >
                  {saved ? "✅ Saved!" : saving ? "⏳ Saving..." : "💾 Save Recap to Journal"}
                </button>
                <button
                  onClick={handleCopy}
                  className={`px-1 py-0.5 rounded text-[7px] transition-all ${
                    copied
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-surface-800/40 text-surface-400 border border-white/[0.04] hover:text-white/60"
                  }`}
                >
                  {copied ? "✅ Copied" : "📋 Copy"}
                </button>
              </div>
              <button
                onClick={handleClear}
                className="w-full px-1 py-0.5 rounded text-[7px] bg-rose-500/8 text-rose-400 border border-rose-500/10 hover:bg-rose-500/12 transition-colors"
              >
                🗑 Clear Session Data
              </button>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-surface-500">
              {characters.length} PCs · {journalCount} journal entries
            </span>
            <span className="text-[6px] text-surface-600">
              v{totalRounds > 0 ? "Combat Active" : "Session Running"}
            </span>
          </div>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
