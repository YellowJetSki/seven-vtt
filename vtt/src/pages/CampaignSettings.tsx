/* ── Campaign Settings ─────────────────────────────────────────
 * Full campaign settings with:
 *   - Campaign metadata editing (name, description)
 *   - Game rules (XP system, currency name)
 *   - Private DM notes with lockable screen-share protection
 *   - Scratch pad saved to campaign store (synced to Firebase)
 *   - Import/Export/Reset operations with Firebase sync triggers
 *
 * FIREBASE SYNC: All data is stored in the campaign store, which
 * is pushed to Firestore via useFirebaseSync. Changes made on
 * one DM device instantly reflect on all others.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { triggerFullSync } from "@/hooks/useFirebaseSync";
import { Button } from "@/components/ui/Button";
import { LockableNotes } from "@/components/ui/LockableNotes";
import { createDemoCampaign } from "@/data/demoCampaign";
import { isFirebaseAvailable } from "@/lib/firebase";

export function CampaignSettings() {
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const _clearCampaign = useCampaignStore((s) => s.clearCampaign);
  const showToast = useUiStore((s) => s.showToast);

  const [campaignName, setCampaignName] = useState(campaign?.name ?? "");
  const [campaignDescription, setCampaignDescription] = useState(campaign?.description ?? "");
  const [xpSystem, setXpSystem] = useState(campaign?.settings.experienceSystem ?? "milestone");
  const [currencyName, setCurrencyName] = useState(campaign?.settings.currencyName ?? "Gold Pieces");
  const [dmNotes, setDmNotes] = useState(campaign?.settings.privateDmNotes ?? "");
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields when campaign loads/changes
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setCampaignDescription(campaign.description ?? "");
      setXpSystem(campaign.settings.experienceSystem);
      setCurrencyName(campaign.settings.currencyName);
      setDmNotes(campaign.settings.privateDmNotes);
    }
  }, [
    campaign?.id,
    campaign?.name,
    campaign?.description,
    campaign?.settings.experienceSystem,
    campaign?.settings.currencyName,
    campaign?.settings.privateDmNotes,
  ]);

  const handleSave = useCallback(() => {
    if (!campaign) return;

    setCampaign({
      ...campaign,
      name: campaignName.trim() || campaign.name,
      description: campaignDescription.trim() || campaign.description,
      settings: {
        ...campaign.settings,
        experienceSystem: xpSystem,
        currencyName,
      },
      updatedAt: Date.now(),
    });
    setIsDirty(false);
    showToast({ message: "Campaign settings saved.", type: "success" });
  }, [campaign, campaignName, campaignDescription, xpSystem, currencyName, setCampaign, showToast]);

  const handleReset = useCallback(() => {
    if (!campaign) return;
    setCampaign({
      ...campaign,
      settings: {
        ...campaign.settings,
        experienceSystem: "milestone",
        currencyName: "Gold Pieces",
      },
      updatedAt: Date.now(),
    });
    setXpSystem("milestone");
    setCurrencyName("Gold Pieces");
    setIsDirty(false);
    showToast({ message: "Settings reset to defaults.", type: "info" });
  }, [campaign, setCampaign, showToast]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setCampaign({ ...json, updatedAt: Date.now() });
        showToast({ message: "Campaign imported successfully!", type: "success" });
      } catch {
        showToast({ message: "Invalid JSON file.", type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [setCampaign, showToast]);

  const handleExport = useCallback(() => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: "Campaign exported!", type: "success" });
  }, [campaign, showToast]);

  const handleResetToDemo = useCallback(() => {
    const demo = createDemoCampaign();
    setCampaign(demo);
    setCampaignName(demo.name);
    setCampaignDescription(demo.description ?? "");
    setXpSystem(demo.settings.experienceSystem);
    setCurrencyName(demo.settings.currencyName);
    setIsDirty(false);
    showToast({ message: "Demo campaign loaded!", type: "info" });
  }, [setCampaign, showToast]);

  const handleDMNotesChange = useCallback((value: string) => {
    setDmNotes(value);
    if (campaign) {
      setCampaign({
        ...campaign,
        settings: { ...campaign.settings, privateDmNotes: value },
        updatedAt: Date.now(),
      });
    }
  }, [campaign, setCampaign]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-surface-100">Campaign Settings</h1>
        <p className="text-sm text-surface-400">Manage your campaign metadata, rules, and notes.</p>
      </div>

      {/* Campaign Metadata */}
      <section className="space-y-4 rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Info</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
          <input value={campaignName} onChange={(e) => { setCampaignName(e.target.value); setIsDirty(true); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea value={campaignDescription} onChange={(e) => { setCampaignDescription(e.target.value); setIsDirty(true); }} rows={3}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
        </div>
      </section>

      {/* Game Rules */}
      <section className="space-y-4 rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Game Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Experience System</label>
            <select value={xpSystem} onChange={(e) => { setXpSystem(e.target.value); setIsDirty(true); }}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
              <option value="milestone">Milestone</option>
              <option value="xp">Experience Points</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Currency Name</label>
            <input value={currencyName} onChange={(e) => { setCurrencyName(e.target.value); setIsDirty(true); }}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          </div>
        </div>
      </section>

      {/* Private DM Notes (synced to Firebase) */}
      <section className="space-y-4 rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Private DM Notes</h2>
        <p className="text-xs text-surface-500">These notes are synced to Firebase and available on all DM devices.</p>
        <LockableNotes value={dmNotes} onChange={handleDMNotesChange} label="DM Notes" />
      </section>

      {/* Save / Reset */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={!isDirty || !campaign}>Save Changes</Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>Reset to Defaults</Button>
        {isDirty && <span className="text-xs text-warrior-400">Unsaved changes</span>}
      </div>

      {/* Danger Zone */}
      <section className="space-y-4 rounded-xl border border-warrior-500/30 bg-warrior-500/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warrior-400">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" size="sm" onClick={handleImport}>Import JSON</Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>Export JSON</Button>
          <Button variant="danger" size="sm" onClick={handleResetToDemo}>Reset to Demo</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Sync to Firebase Now
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />
        {showDeleteConfirm && (
          <div className="space-y-2">
            <p className="text-xs text-surface-400">This will force-push all local data to Firebase immediately.</p>
            <div className="flex gap-2">
              <Button size="xs" variant="primary"
                onClick={async () => {
                  await triggerFullSync();
                  setShowDeleteConfirm(false);
                  showToast({ message: "Full sync triggered!", type: "success" });
                }}>
                Confirm Sync
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
