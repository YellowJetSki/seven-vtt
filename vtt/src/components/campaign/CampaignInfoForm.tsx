/**
 * STᚱ VTT — Campaign Info Form (Premium Gold Version)
 *
 * Editable campaign metadata: name, description, DM name.
 * Shows creation date and last updated timestamp.
 */

import { useState, useCallback, useEffect } from "react";
import type { CampaignMeta } from "@/types";
import SettingsSection from "./SettingsSection";

interface CampaignInfoFormProps {
  meta: CampaignMeta | null;
  onSave: (updates: Partial<CampaignMeta>) => void;
}

export default function CampaignInfoForm({ meta, onSave }: CampaignInfoFormProps) {
  const [name, setName] = useState(meta?.name || "");
  const [description, setDescription] = useState(meta?.description || "");
  const [dmName, setDmName] = useState(meta?.dmName || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(meta?.name || "");
    setDescription(meta?.description || "");
    setDmName(meta?.dmName || "");
    setHasChanges(false);
  }, [meta?.id]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      dmName: dmName.trim() || "Dungeon Master",
    });
    setHasChanges(false);
  }, [name, description, dmName, onSave]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  if (!meta) {
    return (
      <SettingsSection icon="📋" title="Campaign Info" description="No campaign created yet.">
        <p className="text-sm text-surface-500">Set up a campaign to get started.</p>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection icon="📋" title="Campaign Info" description="Name, description, and DM identity">
      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); markChanged(); }}
            placeholder="Enter campaign name..."
            className="w-full py-2 px-3 rounded-lg text-sm font-semibold bg-[#07080d]/70 border border-white/[0.06] text-gold-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 transition-all"
          />
        </div>

        {/* DM Name */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Dungeon Master</label>
          <input
            type="text"
            value={dmName}
            onChange={(e) => { setDmName(e.target.value); markChanged(); }}
            placeholder="DM name..."
            className="w-full py-2 px-3 rounded-lg text-sm bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markChanged(); }}
            placeholder="Campaign synopsis, setting, or premise..."
            rows={3}
            className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-surface-300 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 resize-y min-h-[60px] transition-all"
          />
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[9px] text-surface-500 space-y-0.5">
            <div>Created {meta.createdAt ? new Date(meta.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</div>
            <div>Updated {meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</div>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || !name.trim()}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            💾 Save Info
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}
