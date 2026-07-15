/* ── Export All Button — Full Campaign + Homebrew Export ───────
 * One-click export of all campaign data AND homebrew library
 * into a single comprehensive JSON bundle.
 * ─────────────────────────────────────────────────────────────── */

import { useCampaignStore } from "@/stores/campaignStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

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
  const campaign = useCampaignStore((s) => s.campaign);
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
