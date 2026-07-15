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
  const [xpSystem, setXpSystem] = useState<"xp" | "milestone">(campaign?.settings.experienceSystem ?? "milestone");
  const [currencyName, setCurrencyName] = useState(campaign?.settings.currencyName ?? "Gold Pieces");
  const [dmNotes, setDmNotes] = useState(campaign?.settings.privateDmNotes ?? "");
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields when campaign loads/changes
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name ?? "");
      setCampaignDescription(campaign.description ?? "");
      setXpSystem(campaign.settings.experienceSystem ?? "milestone");
      setCurrencyName(campaign.settings.currencyName ?? "Gold Pieces");
      setDmNotes(campaign.settings.privateDmNotes ?? "");
      setIsDirty(false);
    }
  }, [campaign]);

  const handleDMNotesChange = useCallback((value: string) => {
    setDmNotes(value);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!campaign) return;
    setCampaign({
      ...campaign,
      name: campaignName,
      description: campaignDescription,
      settings: {
        ...campaign.settings,
        experienceSystem: xpSystem,
        currencyName,
        privateDmNotes: dmNotes,
      },
    });
    setIsDirty(false);
    // Trigger full Firebase sync after saving
    if (isFirebaseAvailable()) {
      await triggerFullSync();
    }
    showToast({ message: "Campaign settings saved and synced.", type: "success" });
  }, [campaign, campaignName, campaignDescription, xpSystem, currencyName, dmNotes, setCampaign, showToast]);

  const handleReset = useCallback(() => {
    if (!campaign) return;
    setCampaignName(campaign.name ?? "");
    setCampaignDescription(campaign.description ?? "");
    setXpSystem(campaign.settings.experienceSystem ?? "milestone");
    setCurrencyName(campaign.settings.currencyName ?? "Gold Pieces");
    setDmNotes(campaign.settings.privateDmNotes ?? "");
    setIsDirty(false);
    showToast({ message: "Form reset to saved values.", type: "info" });
  }, [campaign, showToast]);

  const handleExport = useCallback(() => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [campaign]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Validate minimal campaign structure
      if (!data.name || !data.playerCharacters) {
        showToast({ message: "Invalid campaign file.", type: "error" });
        return;
      }
      setCampaign(data);
      showToast({ message: `Campaign "${data.name}" imported.`, type: "success" });
    } catch {
      showToast({ message: "Failed to parse campaign file.", type: "error" });
    }
    e.target.value = "";
  }, [setCampaign, showToast]);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-8 text-center">
          <span className="text-4xl">⚙️</span>
          <h2 className="mt-3 text-lg font-semibold text-surface-200">No Campaign Loaded</h2>
          <p className="mt-1 text-sm text-surface-500">
            Create or import a campaign to adjust settings.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => {
              setCampaign(createDemoCampaign());
              showToast({ message: "Demo campaign created!", type: "success" });
            }}>
              Create Demo Campaign
            </Button>
            <Button variant="secondary" onClick={handleImport}>
              Import Campaign
            </Button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelected} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">Campaign Settings</h2>
          <p className="mt-1 text-sm text-surface-400">Manage campaign rules, notes, and data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" onClick={handleExport}>Export</Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelected} />
        </div>
      </div>

      {/* Campaign Name & Description */}
      <section className="space-y-4 rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Info</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
          <input value={campaignName} onChange={(e) => { setCampaignName(e.target.value); setIsDirty(true); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea value={campaignDescription} onChange={(e) => { setCampaignDescription(e.target.value); setIsDirty(true); }}
            rows={3}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
      </section>

      {/* Game Rules */}
      <section className="space-y-4 rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Game Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Experience System</label>
            <select value={xpSystem} onChange={(e) => { setXpSystem(e.target.value as "xp" | "milestone"); setIsDirty(true); }}
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
        <LockableNotes defaultLocked={false}>
          <textarea
            value={dmNotes}
            onChange={(e) => handleDMNotesChange(e.target.value)}
            rows={6}
            placeholder="Enter private DM notes here..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </LockableNotes>
      </section>

      {/* Save / Reset */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={!isDirty || !campaign}>Save Changes</Button>
        <Button variant="ghost" size="sm" onClick={handleReset}>Reset to Defaults</Button>
        {isDirty && <span className="text-xs text-warrior-400">Unsaved changes</span>}
      </div>

      {/* Danger Zone */}
      <section className="space-y-4 rounded-xl border border-warrior-500/20 bg-warrior-500/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warrior-400">Danger Zone</h2>
        <p className="text-xs text-surface-500">
          These actions are irreversible. Use with caution.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete All Campaign Data
          </Button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-100">Delete All Campaign Data?</h3>
            <p className="mt-2 text-sm text-surface-400">
              This will permanently delete the current campaign and all its data locally.
              Firebase data can be restored by re-syncing.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={async () => {
                _clearCampaign();
                setShowDeleteConfirm(false);
                showToast({ message: "Campaign data cleared.", type: "warning" });
              }}>
                Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
