/* ── Campaign Scratch Pad — Quick DM Notes (persisted) ─────────
 * A floating/minimalist scratch pad that the DM can open from
 * any page. Auto-saves to the campaign store's privateDmNotes field.
 *
 * ── Position Note ────────────────────────────────────────────
 * Uses `bottom-16 right-4` (above toast container's `bottom-4`)
 * to avoid overlap. z-50 keeps it above most UI but below modals (z-50+).
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";
import type { Campaign } from "@/types";

export function CampaignScratchPad() {
  const [isOpen, setIsOpen] = useState(false);
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const campaign = meta ? { id: meta.id, name: meta.name, playerCharacters: characters, encounters: [], battleMaps: [], journal: [], createdAt: meta.createdAt, updatedAt: meta.updatedAt } as Campaign : null;
  const [scratchText, setScratchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from campaign settings
  useEffect(() => {
    if (campaign?.settings.privateDmNotes) {
      setScratchText(campaign.settings.privateDmNotes);
    }
  }, [campaign?.id]);

  // Auto-save with debounce
  const persistScratch = useCallback(
    (value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (campaign) {
          setCampaign({
            ...campaign,
            settings: { ...campaign.settings, privateDmNotes: value },
            updatedAt: Date.now(),
          });
        }
      }, 1000);
    },
    [campaign, setCampaign],
  );

  const handleChange = useCallback(
    (value: string) => {
      setScratchText(value);
      persistScratch(value);
    },
    [persistScratch],
  );

  const handleClear = useCallback(() => {
    setScratchText("");
    persistScratch("");
  }, [persistScratch]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Keyboard shortcut: Ctrl+Shift+N to toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "N") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg transition-all hover:bg-accent-500 hover:scale-110"
        title="Open Scratch Pad (Ctrl+Shift+N)"
      >
        📝
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 w-80 animate-slide-up">
      <div className="overflow-hidden rounded-xl border border-surface-700 bg-surface-850 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-200">
            Scratch Pad
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
              className="text-xs text-surface-500 transition-colors hover:text-surface-200"
              title="Search in notes (Ctrl+F)"
            >
              🔍
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-surface-500 transition-colors hover:text-surface-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="border-b border-surface-700 px-4 py-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in notes..."
              className="w-full rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <p className="text-[10px] text-surface-500 mt-1">
                {scratchText.toLowerCase().includes(searchQuery.toLowerCase())
                  ? "✓ Found"
                  : "No matches"}
              </p>
            )}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={scratchText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Quick notes for this session..."
          rows={6}
          className="w-full resize-none border-0 bg-surface-850 px-4 py-3 text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none"
          autoFocus
        />
        <div className="flex items-center justify-between border-t border-surface-700 px-4 py-2">
          <span className="text-[10px] text-surface-500">Auto-saved</span>
          <Button variant="ghost" size="xs" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
