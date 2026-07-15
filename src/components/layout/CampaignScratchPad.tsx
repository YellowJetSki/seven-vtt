/* ── Campaign Scratch Pad — Quick DM Notes (persisted) ─────────
 * A floating/minimalist scratch pad that the DM can open from
 * any page. Auto-saves to campaign store scratchPad field.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";

export function CampaignScratchPad() {
  const [isOpen, setIsOpen] = useState(false);
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const [scratchText, setScratchText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from campaign settings
  useEffect(() => {
    if (campaign?.settings.privateDmNotes) {
      setScratchText(campaign.settings.privateDmNotes);
    }
  }, [campaign?.id]);

  // Auto-save with debounce
  const handleChange = (value: string) => {
    setScratchText(value);
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
  };

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
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
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg hover:bg-accent-500 transition-all hover:scale-110"
        title="Open Scratch Pad (Ctrl+Shift+N)"
      >
        📝
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 animate-slide-up">
      <div className="rounded-xl border border-surface-700 bg-surface-850 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
          <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider">Scratch Pad</h3>
          <button onClick={() => setIsOpen(false)} className="text-surface-500 hover:text-surface-200 text-xs">✕</button>
        </div>
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
          <Button variant="ghost" size="xs" onClick={() => { setScratchText(""); handleChange(""); }}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
