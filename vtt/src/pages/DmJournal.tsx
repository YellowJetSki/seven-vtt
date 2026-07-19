/**
 * STᚱ VTT — DM Journal (Session & Quest Tracker)
 *
 * Operational journal for campaign management:
 * - Three-panel layout: sidebar (entry list) | editor | quick stats
 * - Type filtering: Sessions, Quests, Lore, Notes, Handouts
 * - Search across title + content + tags
 * - Session-numbered tracking
 * - Tag system with quick-add
 * - Full CRUD: create, edit, save, delete
 * - Session quest tracking with live status
 * - All mutations write to Zustand + Firestore via entitySlice
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import JournalSidebar from "@/components/journal/JournalSidebar";
import JournalEditor from "@/components/journal/JournalEditor";
import type { JournalEntry, JournalEntryType } from "@/types";

export default function DmJournal() {
  const journal = useCampaignStore((s) => s.journal);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);
  const updateJournalEntry = useCampaignStore((s) => s.updateJournalEntry);
  const removeJournalEntry = useCampaignStore((s) => s.removeJournalEntry);

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeEntry = useMemo(
    () => journal.find((e) => e.id === activeEntryId) || null,
    [journal, activeEntryId]
  );

  // ── Stats ──
  const stats = useMemo(() => {
    return {
      total: journal.length,
      sessions: journal.filter((e) => e.type === "session").length,
      quests: journal.filter((e) => e.type === "quest").length,
      lore: journal.filter((e) => e.type === "lore").length,
      notes: journal.filter((e) => e.type === "note").length,
      handouts: journal.filter((e) => e.type === "handout").length,
      currentSession: Math.max(
        ...journal
          .filter((e) => e.type === "session" && e.sessionNumber)
          .map((e) => e.sessionNumber || 0),
        0
      ),
      recentEntries: [...journal]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 3),
    };
  }, [journal]);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setActiveEntryId(null);
  }, []);

  const handleSave = useCallback(
    (data: Partial<JournalEntry> & { id: string }) => {
      if (isCreating) {
        addJournalEntry({
          id: data.id,
          title: data.title || "Untitled",
          content: data.content || "",
          type: (data.type as JournalEntryType) || "note",
          tags: data.tags || [],
          sessionNumber: data.sessionNumber,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setActiveEntryId(data.id);
        setIsCreating(false);
      } else {
        updateJournalEntry(data.id, {
          title: data.title,
          content: data.content,
          type: data.type,
          tags: data.tags,
          sessionNumber: data.sessionNumber,
        });
      }
    },
    [isCreating, addJournalEntry, updateJournalEntry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeJournalEntry(id);
      if (activeEntryId === id) {
        setActiveEntryId(null);
      }
    },
    [activeEntryId, removeJournalEntry]
  );

  const handleSelectEntry = useCallback(
    (id: string) => {
      setActiveEntryId(id);
      setIsCreating(false);
    },
    []
  );

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* ── Page Header ── */}
        <div className="shrink-0 glass-gold rounded-2xl m-4 p-4 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                Journal
              </h1>
              <p className="text-[11px] text-surface-500 mt-1">
                Campaign notes, session logs, quest tracking, and lore
              </p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2">
              {stats.currentSession > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                  Session #{stats.currentSession}
                </span>
              )}
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 rounded text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
              >
                ✦ New Entry
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="shrink-0 mx-4 mb-4 flex items-center gap-3 text-[9px] text-surface-500">
          <span className="text-gold-400/60 font-semibold">{stats.total} entries</span>
          <span>🎲 {stats.sessions} sessions</span>
          <span>⚔ {stats.quests} quests</span>
          <span>📜 {stats.lore} lore</span>
          <span>📝 {stats.notes} notes</span>
          <span>📄 {stats.handouts} handouts</span>
        </div>

        {/* ── Main content: sidebar + editor ── */}
        <div className="flex-1 mx-4 mb-4 rounded-xl overflow-hidden border border-white/[0.04] flex">
          {/* Sidebar */}
          <JournalSidebar
            entries={journal}
            activeEntryId={isCreating ? null : activeEntryId}
            onSelectEntry={handleSelectEntry}
          />

          {/* Divider */}
          <div className="w-[1px] bg-white/[0.03]" />

          {/* Editor */}
          <JournalEditor
            entry={isCreating ? null : activeEntry}
            onSave={handleSave}
            onDelete={handleDelete}
            onCreate={handleCreate}
            isNew={isCreating}
          />
        </div>
      </div>
    </AppShell>
  );
}
