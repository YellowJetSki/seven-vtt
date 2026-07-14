import { useState, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

export function CampaignSettings() {
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);
  const setCampaign = useCampaignStore((s) => s.setCampaign);

  const [campaignName, setCampaignName] = useState(campaign?.name ?? "");
  const [campaignDescription, setCampaignDescription] = useState(campaign?.description ?? "");
  const [xpSystem, setXpSystem] = useState(campaign?.settings.experienceSystem ?? "milestone");
  const [currencyName, setCurrencyName] = useState(campaign?.settings.currencyName ?? "Gold Pieces");
  const [dmNotes, setDmNotes] = useState(campaign?.settings.privateDmNotes ?? "");

  // Sync when campaign loads/changes
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setCampaignDescription(campaign.description ?? "");
      setXpSystem(campaign.settings.experienceSystem);
      setCurrencyName(campaign.settings.currencyName);
      setDmNotes(campaign.settings.privateDmNotes);
    }
  }, [campaign]);

  const hasChanges =
    campaignName !== (campaign?.name ?? "") ||
    campaignDescription !== (campaign?.description ?? "") ||
    xpSystem !== campaign?.settings.experienceSystem ||
    currencyName !== campaign?.settings.currencyName ||
    dmNotes !== campaign?.settings.privateDmNotes;

  const handleSave = () => {
    if (!campaign) return;

    // Update campaign metadata
    setCampaign({
      ...campaign,
      name: campaignName.trim() || campaign.name,
      description: campaignDescription.trim() || undefined,
      settings: {
        ...campaign.settings,
        experienceSystem: xpSystem as "milestone" | "xp",
        currencyName: currencyName.trim() || "Gold Pieces",
        privateDmNotes: dmNotes,
      },
      updatedAt: Date.now(),
    });

    showToast({ message: "Campaign settings saved!", type: "success" });
  };

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl text-surface-600">⚙</span>
          <p className="mt-3 text-sm text-surface-500">
            No campaign loaded. Import a campaign to configure settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-surface-100 md:text-2xl">
          Campaign Settings
        </h2>
        <p className="mt-1 text-sm text-surface-400">
          Configure your Arkla campaign
        </p>
      </div>

      {/* Campaign Info */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">
          Campaign Info
        </h3>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Campaign Name</label>
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Description</label>
          <textarea
            value={campaignDescription}
            onChange={(e) => setCampaignDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-surface-400">XP System</label>
            <div className="flex gap-2">
              <button
                onClick={() => setXpSystem("milestone")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  xpSystem === "milestone"
                    ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                    : "bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600"
                }`}
              >
                Milestone
              </button>
              <button
                onClick={() => setXpSystem("xp")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  xpSystem === "xp"
                    ? "bg-accent-500/15 text-accent-400 border border-accent-500/30"
                    : "bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600"
                }`}
              >
                XP
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-surface-400">Currency Name</label>
            <input
              value={currencyName}
              onChange={(e) => setCurrencyName(e.target.value)}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Private DM Notes */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-400">
          Private DM Notes
        </h3>
        <p className="text-xs text-surface-500">
          These notes are only visible to you. Use them for secrets, plot hooks, and BBEG plans.
        </p>
        <textarea
          value={dmNotes}
          onChange={(e) => setDmNotes(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
          placeholder="The BBEG is the Silvertongue..."
        />
      </section>

      {/* Campaign Stats */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
          Campaign Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Players" value={campaign.playerCharacters.length} icon="⚔" />
          <StatCard label="Encounters" value={campaign.encounters.length} icon="⚡" />
          <StatCard label="Battle Maps" value={campaign.battleMaps.length} icon="🗺" />
          <StatCard label="Journal Entries" value={campaign.journal.length} icon="📖" />
        </div>
      </section>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      )}

      {/* Data Management */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
          Data Management
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm">
            Export Campaign
          </Button>
          <Button variant="secondary" size="sm">
            Import Campaign
          </Button>
          <Button variant="ghost" size="sm">
            Reset Local Data
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-warrior-500/30 bg-warrior-500/5 p-5">
        <h3 className="mb-2 text-sm font-semibold text-warrior-400">
          Danger Zone
        </h3>
        <Button variant="danger" size="sm">
          Delete Campaign
        </Button>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800 p-3 text-center">
      <span className="text-xl">{icon}</span>
      <p className="mt-1 text-lg font-bold text-surface-100">{value}</p>
      <p className="text-[10px] text-surface-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
