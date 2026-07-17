/* ── Campaign Scratch Pad — Quick DM Notes (persisted) ─────────
 * A floating/minimalist scratch pad that the DM can open from
 * any page. Auto-saves to the campaign store's privateDmNotes field.
 *
 * ── Position Note ────────────────────────────────────────────
 * Uses `bottom-16 right-4` (above toast container's `bottom-4`)
 * to avoid overlap. z-50 keeps it above most UI but below modals (z-50+).
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";
import type { Campaign } from "@/types";

export function CampaignScratchPad() {
  const [isOpen, setIsOpen] = useState(false);
  const storeMeta = useCampaignStore((s) => s.meta);
  const storeCharacters = useCampaignStore((s) => s.characters);
  const callSetCampaign = useCampaignStore((s) => s.setCampaign);
  const localCampaign = storeMeta ? { id: storeMeta.id, name: storeMeta.name, settings: storeMeta.settings, playerCharacters: storeCharacters, encounters: [], battleMaps: [], journal: [], createdAt: storeMeta.createdAt, updatedAt: storeMeta.updatedAt } as Campaign : null;
  const [scratchText, setScratchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from campaign settings
  useEffect(() => {
    if (localCampaign?.settings?.privateDmNotes) {
      setScratchText(localCampaign.settings.privateDmNotes);
    }
  }, [localCampaign?.id]);

  // Auto-save with debounce
  const persistScratch = useCallback(
    (value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (localCampaign) {
          callSetCampaign({
            ...localCampaign,
            settings: { ...localCampaign.settings, privateDmNotes: value },
            updatedAt: Date.now(),
          });
        }
      }, 1000);
    },
    [localCampaign, callSetCampaign],
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

  if (!localCampaign) return null;

  const allText = searchQuery.trim()
    ? scratchText.split("\n").filter((l) => l.toLowerCase().includes(searchQuery.toLowerCase())).join("\n")
    : scratchText;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-16 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg transition-all hover:bg-accent-500 hover:scale-110"
        title="Scratch Pad"
      >
        📝
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-semibold text-surface-100">📝 DM Scratch Pad</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(!showSearch)} className="text-surface-500 hover:text-surface-300 text-xs">
                  🔍
                </button>
                <button onClick={handleClear} className="text-surface-500 hover:text-warrior-400 text-xs">
                  🗑️
                </button>
                <button onClick={() => setIsOpen(false)} className="text-surface-500 hover:text-surface-200 text-xs">
                  ✕
                </button>
              </div>
            </div>

            {showSearch && (
              <div className="mb-3 relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 text-xs">
                    ✕
                  </button>
                )}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={allText}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Type your session notes, ideas, or anything you want to remember..."
              className="flex-1 min-h-[200px] resize-none rounded-lg border border-surface-700 bg-surface-800 p-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            />

            <div className="flex items-center justify-between mt-3 text-[10px] text-surface-500 shrink-0">
              <span>Auto-saves to campaign storage</span>
              <span>{scratchText.length} chars</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
