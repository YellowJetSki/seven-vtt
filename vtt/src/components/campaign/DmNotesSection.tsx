/**
 * STᚱ VTT — DM Private Notes Section (Premium Gold Version)
 *
 * Private notes visible only to the DM. Session preparation notes,
 * secret plot hooks, NPC motivations, and upcoming encounter ideas.
 */

import { useState, useCallback, useEffect } from "react";
import type { CampaignSettings } from "@/types";
import SettingsSection from "./SettingsSection";

interface DmNotesSectionProps {
  settings: CampaignSettings;
  onSave: (settings: Partial<CampaignSettings>) => void;
}

export default function DmNotesSection({ settings, onSave }: DmNotesSectionProps) {
  const [notes, setNotes] = useState(settings.privateDmNotes || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setNotes(settings.privateDmNotes || "");
    setHasChanges(false);
  }, [settings.privateDmNotes]);

  const handleSave = useCallback(() => {
    onSave({ privateDmNotes: notes });
    setHasChanges(false);
  }, [notes, onSave]);

  return (
    <SettingsSection icon="🔒" title="DM Private Notes" description="Only visible to you. Session prep, plot hooks, secrets.">
      <div className="space-y-2">
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setHasChanges(true); }}
          placeholder="Write your private DM notes here..."
          rows={6}
          className="w-full py-2 px-3 rounded-lg text-xs leading-relaxed bg-[#07080d]/70 border border-white/[0.06] text-surface-300 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 resize-y min-h-[120px] transition-all"
        />
        <div className="flex items-center justify-between">
          <div className="text-[8px] text-surface-700">
            {notes.length} characters · Saved to campaign data
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            💾 Save Notes
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}
