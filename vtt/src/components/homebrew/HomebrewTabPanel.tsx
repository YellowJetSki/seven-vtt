/**
 * STᚱ VTT — Homebrew Tab Panel
 *
 * Renders the appropriate list of cards based on the active tab.
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
        />
      ))}
    </div>
  );
}
