/* ── Export All Button — Full Campaign + Homebrew Export ───────
 * One-click export of all campaign data AND homebrew library
 * into a single comprehensive JSON bundle.
 * ─────────────────────────────────────────────────────────────── */

import { useCampaignStore } from "@/stores/campaignStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";
import type { Campaign } from "@/types";

interface ExportAllButtonProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
}

export function ExportAllButton({
  variant = "secondary",
  size = "sm",
  label = "📦 Export All",
}: ExportAllButtonProps) {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const journal = useCampaignStore((s) => s.journal);
  const campaign = meta ? { id: meta.id, name: meta.name, description: meta.description, dmName: meta.dmName, settings: meta.settings, playerCharacters: characters, encounters, battleMaps, journal, createdAt: meta.createdAt, updatedAt: meta.updatedAt } as Campaign : null;
  const homebrewItems = useHomebrewStore((s) => s.items);
  const homebrewFeats = useHomebrewStore((s) => s.feats);
  const homebrewSpells = useHomebrewStore((s) => s.spells);
  const showToast = useUiStore((s) => s.showToast);

  const handleExport = () => {
    if (!campaign) {
      showToast({ message: "No campaign to export.", type: "warning" });
      return;
    }

    const bundle = {
      exportedAt: Date.now(),
      appVersion: "str-vtt-1.0",
      campaign,
      homebrew: {
        items: homebrewItems,
        feats: homebrewFeats,
        spells: homebrewSpells,
      },
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-full-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const records = 1 + homebrewItems.length + homebrewFeats.length + homebrewSpells.length;
    showToast({ message: `Exported ${records} records (campaign + ${homebrewItems.length} items, ${homebrewFeats.length} feats, ${homebrewSpells.length} spells).`, type: "success" });
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport}>
      {label}
    </Button>
  );
}
