/* ── Campaign Settings ─────────────────────────────────────────
 * Full campaign settings with:
 *   - Campaign metadata editing (name, description)
 *   - Game rules (XP system, currency name)
 *   - Private DM notes with lockable screen-share protection
 *   - Scratch pad with auto-save to localStorage
 *   - Import/Export/Reset operations with Firebase sync triggers
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
  const [scratchPad, setScratchPad] = useState<string>(() => {
    return localStorage.getItem("vtt-scratch-pad") ?? "";
  });
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

  // Auto-save scratch pad to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("vtt-scratch-pad", scratchPad);
    }, 500);
    return () => clearTimeout(timer);
  }, [scratchPad]);

  const handleSave = useCallback(() => {
    if (!campaign) return;

    setCampaign({
      ...campaign,
      name: campaignName.trim() || campaign.name,
      description: campaignDescription.trim() || undefined,
      settings: {
        ...campaign.settings,
        experienceSystem: xpSystem,
        currencyName: currencyName.trim() || "Gold Pieces",
        privateDmNotes: dmNotes.trim(),
      },
      updatedAt: Date.now(),
    });

    setIsDirty(false);
    showToast({ message: "Settings saved! Changes will sync to Firebase shortly.", type: "success" });
  }, [campaign, campaignName, campaignDescription, xpSystem, currencyName, dmNotes, setCampaign, showToast]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  /* ── Export Campaign ── */
  const handleExport = useCallback(() => {
    if (!campaign) return;

    try {
      const exportData = {
        campaign,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `str-vtt-${campaign.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast({ message: "Campaign exported successfully!", type: "success" });
    } catch {
      showToast({ message: "Failed to export campaign data.", type: "error" });
    }
  }, [campaign, showToast]);

  /* ── Import Campaign ── */
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.campaign || !data.campaign.name) {
          showToast({ message: "Invalid campaign file format.", type: "error" });
          return;
        }

        const restored = {
          ...data.campaign,
          updatedAt: Date.now(),
        };

        setCampaign(restored);
        showToast({
          message: `Campaign "${restored.name}" imported successfully!`,
          type: "success",
        });

        if (isFirebaseAvailable()) {
          triggerFullSync().then((ok) => {
            if (ok) {
              showToast({ message: "Imported data synced to Firebase.", type: "info", duration: 3000 });
            }
          });
        }
      } catch {
        showToast({ message: "Failed to parse campaign file. Ensure it's valid JSON.", type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [setCampaign, showToast]);

  /* ── Reset to Demo ── */
  const handleResetToDemo = useCallback(() => {
    const demo = createDemoCampaign();
    setCampaign(demo);
    setShowDeleteConfirm(false);
    showToast({ message: "Reset to demo campaign data.", type: "info" });

    if (isFirebaseAvailable()) {
      triggerFullSync().then((ok) => {
        if (ok) {
          showToast({ message: "Demo campaign synced to Firebase.", type: "info", duration: 3000 });
        }
      });
    }
  }, [setCampaign, showToast]);

  /* ── Delete Campaign ── */
  const handleDeleteCampaign = useCallback(() => {
    _clearCampaign();
    setShowDeleteConfirm(false);
    showToast({ message: "Campaign data cleared from this device.", type: "info" });

    if (isFirebaseAvailable()) {
      triggerFullSync().then((ok) => {
        if (ok) {
          showToast({ message: "Remote campaign data cleared.", type: "info", duration: 3000 });
        }
      });
    }
  }, [_clearCampaign, showToast]);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <span className="text-4xl text-surface-600">⚙️</span>
          <p className="text-sm text-surface-500">No campaign loaded.</p>
          <Button size="sm" variant="secondary" onClick={handleResetToDemo}>
            Load Demo Campaign
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">Campaign Settings</h2>
          <p className="mt-1 text-sm text-surface-400">Manage your campaign details and DM tools</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty}>
          {isDirty ? "💾 Save Changes" : "Saved ✓"}
        </Button>
      </div>

      {/* Campaign Info */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Info</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
          <input
            value={campaignName}
            onChange={(e) => { setCampaignName(e.target.value); markDirty(); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea
            value={campaignDescription}
            onChange={(e) => { setCampaignDescription(e.target.value); markDirty(); }}
            rows={3}
            className="w-full resize-none rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Game Rules */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Game Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Experience System</label>
            <div className="flex gap-2">
              {(["milestone", "xp"] as const).map((system) => (
                <button
                  key={system}
                  onClick={() => { setXpSystem(system); markDirty(); }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    xpSystem === system
                      ? "border-accent-500 bg-accent-500/10 text-accent-300"
                      : "border-surface-700 bg-surface-800 text-surface-400 hover:text-surface-200"
                  }`}
                >
                  {system === "milestone" ? "Milestone" : "Experience Points"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Currency Name</label>
            <input
              value={currencyName}
              onChange={(e) => { setCurrencyName(e.target.value); markDirty(); }}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* DM Notes (Lockable) */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Private DM Notes</h3>
        <LockableNotes>
          <textarea
            value={dmNotes}
            onChange={(e) => { setDmNotes(e.target.value); markDirty(); }}
            rows={6}
            placeholder="Your secret campaign notes — use the lock button to hide during screen-sharing..."
            className="w-full min-h-[120px] resize-y rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </LockableNotes>
      </section>

      {/* Scratch Pad */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Scratch Pad</h3>
        <p className="text-xs text-surface-500">
          Quick notes that auto-save. Press Ctrl+Shift+N to toggle the floating scratch pad.
        </p>
        <textarea
          value={scratchPad}
          onChange={(e) => setScratchPad(e.target.value)}
          rows={6}
          placeholder="Jot down quick notes, encounter ideas, or loot..."
          className="w-full min-h-[120px] resize-y rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </section>

      {/* Data Management */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">
          Data Management
          {isFirebaseAvailable() && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-divine-500/10 px-2 py-0.5 text-[10px] font-normal text-divine-400">
              <span className="h-1.5 w-1.5 rounded-full bg-divine-400 animate-pulse" />
              Firebase Sync Active
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={handleExport}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-3 text-center text-xs text-surface-300 transition-all hover:border-accent-500/50 hover:text-surface-100"
          >
            <span className="mb-1 block text-lg">📥</span>
            Export Campaign
          </button>

          <button
            onClick={handleImportClick}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-3 text-center text-xs text-surface-300 transition-all hover:border-accent-500/50 hover:text-surface-100"
          >
            <span className="mb-1 block text-lg">📤</span>
            Import Campaign
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={handleResetToDemo}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-3 text-center text-xs text-surface-300 transition-all hover:border-mage-500/50 hover:text-surface-100"
          >
            <span className="mb-1 block text-lg">🔄</span>
            Reset to Demo
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-warrior-500/30 bg-warrior-500/5 px-3 py-3 text-center text-xs text-warrior-400 transition-all hover:border-warrior-500/50 hover:bg-warrior-500/10"
          >
            <span className="mb-1 block text-lg">🗑️</span>
            Clear Local Data
          </button>
        </div>
        <p className="mt-2 text-[11px] text-surface-500">
          Export creates a full JSON backup. Import restores from a previously exported file.
          Reset replaces all data with the demo campaign. Clear removes data from this device.
        </p>
      </section>

      {/* Campaign Stats */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Stats</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-surface-800 p-3 text-center">
            <p className="text-2xl font-bold text-surface-100">{campaign.playerCharacters.length}</p>
            <p className="text-[11px] text-surface-500">Characters</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-3 text-center">
            <p className="text-2xl font-bold text-surface-100">{campaign.encounters.length}</p>
            <p className="text-[11px] text-surface-500">Encounters</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-3 text-center">
            <p className="text-2xl font-bold text-surface-100">{campaign.battleMaps.length}</p>
            <p className="text-[11px] text-surface-500">Battle Maps</p>
          </div>
          <div className="rounded-lg bg-surface-800 p-3 text-center">
            <p className="text-2xl font-bold text-surface-100">{campaign.journal.length}</p>
            <p className="text-[11px] text-surface-500">Journal Entries</p>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-surface-100">Clear Local Data?</h3>
            <p className="mt-2 text-sm text-surface-400">
              This removes all campaign data from this device. If Firebase sync is active, remote data will also be cleared.
              Export first if you want to keep a backup.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteCampaign}>
                Clear Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
