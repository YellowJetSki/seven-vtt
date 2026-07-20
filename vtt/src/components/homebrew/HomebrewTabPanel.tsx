/**
 * STᚱ VTT — Homebrew Tab Panel (Premium v3.1)
 *
 * Enhanced with staggered card entrance animations, gold-accented
 * tab switching transitions, bulk-select mode support, and
 * consistent premium layout with direct glass gradient backgrounds.
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
  const baseDelay = 50; // ms

  if (activeTab === "items") {
    if (items.length === 0) return <HomebrewEmptyState tabLabel="items" />;
    return (
      <div style={{ animation: "slide-in-up 0.3s ease-out both" }}>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(items.indexOf(item) * 25, 600)}ms both` }}
            >
              <HomebrewItemCard
                item={item}
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item.id)}
                onDuplicate={() => onDuplicateItem(item)}
                onToggleVisibility={(id, visible) => onToggleItemVisibility(id, visible)}
                isBulkMode={isBulkMode}
                isSelected={selectedIds?.has(item.id)}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "spells") {
    if (spells.length === 0) return <HomebrewEmptyState tabLabel="spells" />;
    return (
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.05s both" }}>
        <div className="space-y-2">
          {spells.map((spell) => (
            <div
              key={spell.id}
              style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(spells.indexOf(spell) * 25, 600)}ms both` }}
            >
              <HomebrewSpellCard
                spell={spell}
                onEdit={() => onEditSpell(spell)}
                onDelete={() => onDeleteSpell(spell.id)}
                onDuplicate={() => onDuplicateSpell(spell)}
                onToggleVisibility={(id, visible) => onToggleSpellVisibility(id, visible)}
                isBulkMode={isBulkMode}
                isSelected={selectedIds?.has(spell.id)}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // feats
  if (feats.length === 0) return <HomebrewEmptyState tabLabel="feats" />;
  return (
    <div style={{ animation: "slide-in-up 0.3s ease-out 0.1s both" }}>
      <div className="space-y-2">
        {feats.map((feat) => (
          <div
            key={feat.id}
            style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(feats.indexOf(feat) * 25, 600)}ms both` }}
          >
            <HomebrewFeatCard
              feat={feat}
              onEdit={() => onEditFeat(feat)}
              onDelete={() => onDeleteFeat(feat.id)}
              onDuplicate={() => onDuplicateFeat(feat)}
              onToggleVisibility={(id, visible) => onToggleFeatVisibility(id, visible)}
              isBulkMode={isBulkMode}
              isSelected={selectedIds?.has(feat.id)}
              onToggleSelect={onToggleSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
