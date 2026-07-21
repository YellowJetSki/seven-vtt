/**
 * STᚱ VTT — DM Journal (Premium 7-Layer Cinema Header)
 *
 * Operational journal for campaign management:
 * - Three-panel layout: sidebar (entry list) | editor | quick stats
 * - Type filtering: Sessions, Quests, Lore, Notes, Handouts
 * - Search across title + content + tags
 * - Session-numbered tracking
 * - Tag system with quick-add and suggestions
 * - Full CRUD: create, edit, save, delete
 * - Pin/Unpin entries for quick access
 * - Quick Note floating action button
 * - Markdown preview in read-only and edit mode
 * - Relative timestamps ("5m ago", "2h ago")
 * - Word count, character count
 * - Copy to clipboard for handouts
 *
 * Replaced glass-gold with 7-layer cinema header + glass gradient content.
 */

import { useState, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import JournalSidebar from "@/components/journal/JournalSidebar";
import JournalEditor from "@/components/journal/JournalEditor";
import JournalQuickNote from "@/components/journal/JournalQuickNote";
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
      pinned: journal.filter((e) => e.tags?.includes("pinned")).length,
      currentSession: Math.max(
        ...journal
          .filter((e) => e.type === "session" && e.sessionNumber)
          .map((e) => e.sessionNumber || 0),
        0
      ),
    };
  }, [journal]);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setActiveEntryId(null);
  }, []);

  const handleSave = useCallback(
    (data: Partial<JournalEntry> & { id: string }) => {
      if (isCreating || data.id.startsWith("journal_")) {
        addJournalEntry({
          id: data.id,
          title: data.title || "Untitled",
          content: data.content || "",
          type: (data.type as JournalEntryType) || "note",
          tags: data.tags || [],
          sessionNumber: data.sessionNumber,
          createdAt: data.createdAt || Date.now(),
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

  const handleQuickNote = useCallback(
    (data: { title: string; content: string; type: "note" }) => {
      addJournalEntry({
        id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: data.title,
        content: data.content,
        type: "note",
        tags: [],
        sessionNumber: stats.currentSession > 0 ? stats.currentSession : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    [addJournalEntry, stats.currentSession]
  );

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* ── 7-Layer Cinematic Hero Header ── */}
        <div className="relative rounded-2xl overflow-hidden group mx-4 mt-4">
          {/* Layer 1: Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />
          {/* Layer 2: Conic depth ring */}
          <div
            className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
            style={{ animation: "spin 30s linear infinite" }}
          />
          {/* Layer 3: Top edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />
          {/* Layer 4: Bottom edge light */}
          <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />
          {/* Layer 5: Ambient glow pockets */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />
          {/* Layer 6: Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

          {/* Layer 7: Content */}
          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon container */}
              <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
                <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                  📖
                </span>
              </div>

              <div className="min-w-0 pt-1 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight font-display">
                      Journal
                    </h1>
                    <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                      Campaign notes, session logs, quest tracking, and lore
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                        Session & Quest Tracker
                      </span>
                      {stats.currentSession > 0 && (
                        <span className="text-[9px] px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400 font-medium uppercase tracking-wider">
                          Session #{stats.currentSession}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-200"
                  >
                    ✦ New Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="shrink-0 mx-4 mt-4 flex items-center gap-3 text-[9px] text-surface-500">
          <span className="text-gold-400/60 font-semibold">{stats.total} entries</span>
          <span className="w-px h-3 bg-white/[0.04]" />
          <span>🎲 {stats.sessions} sessions</span>
          <span>⚔ {stats.quests} quests</span>
          <span>📜 {stats.lore} lore</span>
          <span>📝 {stats.notes} notes</span>
          <span>📄 {stats.handouts} handouts</span>
          {stats.pinned > 0 && (
            <>
              <span className="w-px h-3 bg-white/[0.04]" />
              <span className="text-gold-400/40">★ {stats.pinned} pinned</span>
            </>
          )}
        </div>

        {/* ── Main content: sidebar + editor ── */}
        <div className="flex-1 mx-4 mt-3 mb-4 rounded-xl overflow-hidden border border-white/[0.04] bg-gradient-to-b from-[#141520]/80 to-[#0f1019]/85 relative">
          {/* Gold edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />
          <div className="flex h-full">
            {/* Sidebar */}
            <JournalSidebar
              entries={journal}
              activeEntryId={isCreating ? null : activeEntryId}
              onSelectEntry={handleSelectEntry}
            />

            {/* Divider */}
            <div className="w-px bg-white/[0.03]" />

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

        {/* ── Quick Note FAB ── */}
        <JournalQuickNote
          onSave={handleQuickNote}
          lastSessionNumber={stats.currentSession}
        />
      </div>
    </AppShell>
  );
}
