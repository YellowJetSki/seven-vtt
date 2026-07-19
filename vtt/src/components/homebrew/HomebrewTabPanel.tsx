/**
 * STᚱ VTT — Homebrew Tab Panel (v2.0)
 *
 * Enhanced with bulk-select mode, duplicate, and visibility callbacks.
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import type { HomebrewTabId } from "./HomebrewTabs";
import HomebrewItemCard from "./HomebrewItemCard";
import HomebrewSpellCard from "./HomebrewSpellCard";
import HomebrewFeatCard from "./HomebrewFeatCard";
import HomebrewEmptyState from "./HomebrewEmptyState";

interface HomebrewTabPanelProps {
  activeTab: HomebrewTabId;
  items: HomebrewItem[];
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
  onEditItem: (item: HomebrewItem) => void;
  onEditSpell: (spell: HomebrewSpell) => void;
  onEditFeat: (feat: HomebrewFeat) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSpell: (id: string) => void;
  onDeleteFeat: (id: string) => void;
  onDuplicateItem: (item: HomebrewItem) => void;
  onDuplicateSpell: (spell: HomebrewSpell) => void;
  onDuplicateFeat: (feat: HomebrewFeat) => void;
  onToggleItemVisibility: (id: string, visible: boolean) => void;
  onToggleSpellVisibility: (id: string, visible: boolean) => void;
  onToggleFeatVisibility: (id: string, visible: boolean) => void;
  isBulkMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export default function HomebrewTabPanel({
  activeTab,
  items,
  spells,
  feats,
  onEditItem,
  onEditSpell,
  onEditFeat,
  onDeleteItem,
  onDeleteSpell,
  onDeleteFeat,
  onDuplicateItem,
  onDuplicateSpell,
  onDuplicateFeat,
  onToggleItemVisibility,
  onToggleSpellVisibility,
  onToggleFeatVisibility,
  isBulkMode,
  selectedIds,
  onToggleSelect,
}: HomebrewTabPanelProps) {
  if (activeTab === "items") {
    if (items.length === 0) return <HomebrewEmptyState tabLabel="items" />;
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <HomebrewItemCard
            key={item.id}
            item={item}
            onEdit={() => onEditItem(item)}
            onDelete={() => onDeleteItem(item.id)}
            onDuplicate={() => onDuplicateItem(item)}
            onToggleVisibility={onToggleItemVisibility}
            isBulkMode={isBulkMode}
            isSelected={selectedIds?.has(item.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    );
  }

  if (activeTab === "spells") {
    if (spells.length === 0) return <HomebrewEmptyState tabLabel="spells" />;
    return (
      <div className="space-y-2">
        {spells.map((spell) => (
          <HomebrewSpellCard
            key={spell.id}
            spell={spell}
            onEdit={() => onEditSpell(spell)}
            onDelete={() => onDeleteSpell(spell.id)}
            onDuplicate={() => onDuplicateSpell(spell)}
            onToggleVisibility={onToggleSpellVisibility}
            isBulkMode={isBulkMode}
            isSelected={selectedIds?.has(spell.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    );
  }

  // feats
  if (feats.length === 0) return <HomebrewEmptyState tabLabel="feats" />;
  return (
    <div className="space-y-2">
      {feats.map((feat) => (
        <HomebrewFeatCard
          key={feat.id}
          feat={feat}
          onEdit={() => onEditFeat(feat)}
          onDelete={() => onDeleteFeat(feat.id)}
          onDuplicate={() => onDuplicateFeat(feat)}
          onToggleVisibility={onToggleFeatVisibility}
          isBulkMode={isBulkMode}
          isSelected={selectedIds?.has(feat.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
