/* ── Campaign Settings ─────────────────────────────────────────
 * Full campaign settings with DM notes encryption (lockable),
 * campaign metadata editing, and scratch pad persistence.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { LockableNotes } from "@/components/ui/LockableNotes";

export function CampaignSettings() {
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const updateSettings = useCampaignStore((s) => s.updateSettings);
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

  // Sync when campaign loads/changes
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setCampaignDescription(campaign.description ?? "");
      setXpSystem(campaign.settings.experienceSystem);
      setCurrencyName(campaign.settings.currencyName);
      setDmNotes(campaign.settings.privateDmNotes);
    }
  }, [campaign?.id]);

  // Auto-save scratch pad to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("vtt-scratch-pad", scratchPad);
    }, 500);
    return () => clearTimeout(timer);
  }, [scratchPad]);

  const handleSave = () => {
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
    showToast({ message: "Settings saved!", type: "success" });
  };

  const markDirty = () => setIsDirty(true);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="text-4xl text-surface-600">⚙️</span>
          <p className="mt-3 text-sm text-surface-500">No campaign loaded. Create one from the Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">Campaign Settings</h2>
          <p className="mt-1 text-sm text-surface-400">Manage your campaign details and DM tools</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty}>
          {isDirty ? "Save Changes" : "Saved ✓"}
        </Button>
      </div>

      {/* Campaign Info */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Info</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name</label>
          <input value={campaignName} onChange={(e) => { setCampaignName(e.target.value); markDirty(); }}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea value={campaignDescription} onChange={(e) => { setCampaignDescription(e.target.value); markDirty(); }} rows={3}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
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
                <button key={system} onClick={() => { setXpSystem(system); markDirty(); }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    xpSystem === system ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-surface-700 bg-surface-800 text-surface-400 hover:text-surface-200"
                  }`}>
                  {system === "milestone" ? "Milestone" : "Experience Points"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Currency Name</label>
            <input value={currencyName} onChange={(e) => { setCurrencyName(e.target.value); markDirty(); }}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          </div>
        </div>
      </section>

      {/* DM Private Notes */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Private DM Notes</h3>
        <p className="text-xs text-surface-500">These notes are for your eyes only. Use the lock to hide content during screen-sharing.</p>
        <LockableNotes>
          <textarea value={dmNotes} onChange={(e) => { setDmNotes(e.target.value); markDirty(); }} rows={6}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-y min-h-[120px]" />
        </LockableNotes>
      </section>

      {/* Scratch Pad */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Session Scratch Pad</h3>
        <p className="text-xs text-surface-500">Jot down quick notes during the session. Auto-saved locally.</p>
        <textarea value={scratchPad} onChange={(e) => setScratchPad(e.target.value)} rows={4}
          placeholder="Your session scratch pad..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-y min-h-[100px]" />
        <div className="flex justify-end">
          <Button variant="ghost" size="xs" onClick={() => { setScratchPad(""); localStorage.removeItem("vtt-scratch-pad"); }}>
            Clear Scratch Pad
          </Button>
        </div>
      </section>

      {/* Exported Campaign Info */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">Campaign Info</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-surface-800 px-3 py-2"><span className="text-surface-500">Campaign ID</span><p className="text-surface-300 font-mono">{campaign.id}</p></div>
          <div className="rounded-lg bg-surface-800 px-3 py-2"><span className="text-surface-500">Created</span><p className="text-surface-300">{new Date(campaign.createdAt).toLocaleDateString()}</p></div>
          <div className="rounded-lg bg-surface-800 px-3 py-2"><span className="text-surface-500">Players</span><p className="text-surface-300">{campaign.playerCharacters.length}</p></div>
          <div className="rounded-lg bg-surface-800 px-3 py-2"><span className="text-surface-500">Last Updated</span><p className="text-surface-300">{new Date(campaign.updatedAt).toLocaleDateString()}</p></div>
        </div>
      </section>
    </div>
  );
}
