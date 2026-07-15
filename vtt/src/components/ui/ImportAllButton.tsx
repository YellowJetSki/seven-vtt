/* ── Import All Button — Full Campaign + Homebrew Import ───────
 * One-click import of all campaign data AND homebrew library
 * from the comprehensive JSON bundle format.
 * ─────────────────────────────────────────────────────────────── */

import { useRef, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";
import { extractHomebrewFromBundle } from "@/lib/campaign-io";

interface ImportAllButtonProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
}

export function ImportAllButton({
  variant = "secondary",
  size = "sm",
  label = "📦 Import All",
}: ImportAllButtonProps) {
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const showToast = useUiStore((s) => s.showToast);
  const addItem = useHomebrewStore((s) => s.addItem);
  const addFeat = useHomebrewStore((s) => s.addFeat);
  const addSpell = useHomebrewStore((s) => s.addSpell);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Detect bundle format: { campaign: {...}, homebrew: {...} }
      if (data.campaign && data.campaign.name && data.campaign.id) {
        // It's a full bundle — import campaign + homebrew
        setCampaign(data.campaign);
        
        // Import homebrew if present
        const homebrewData = extractHomebrewFromBundle(data);
        if (homebrewData) {
          let itemsAdded = 0;
          let featsAdded = 0;
          let spellsAdded = 0;

          for (const item of homebrewData.items) {
            if (item && item.name && item.category) {
              addItem(item);
              itemsAdded++;
            }
          }
          for (const feat of homebrewData.feats) {
            if (feat && feat.name) {
              addFeat(feat);
              featsAdded++;
            }
          }
          for (const spell of homebrewData.spells) {
            if (spell && spell.name) {
              addSpell(spell);
              spellsAdded++;
            }
          }

          showToast({
            message: `Imported "${data.campaign.name}" with ${itemsAdded} items, ${featsAdded} feats, ${spellsAdded} spells.`,
            type: "success",
          });
        } else {
          showToast({
            message: `Imported campaign "${data.campaign.name}".`,
            type: "success",
          });
        }
      } else if (data.name && data.id) {
        // Legacy: just a campaign object
        setCampaign(data);
        showToast({
          message: `Imported campaign "${data.name}".`,
          type: "success",
        });
      } else {
        showToast({
          message: "Invalid import file. Use a campaign export or full backup bundle.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Import failed:", err);
      showToast({
        message: "Failed to parse file. Ensure it's valid JSON.",
        type: "error",
      });
    }

    e.target.value = "";
  }, [setCampaign, addItem, addFeat, addSpell, showToast]);

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick}>
        {label}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />
    </>
  );
}
