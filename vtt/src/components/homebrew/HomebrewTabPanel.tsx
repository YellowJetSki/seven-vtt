/**
 * STᚱ VTT — Homebrew Tab Panel (Premium v3.2)
 *
 * Enhanced with staggered card entrance animations, gold-accented
 * tab switching transitions, bulk-select mode support, and
 * consistent premium layout. Now supports 4th "enemies" tab
 * for NPC/monster browsing alongside items, spells, and feats.
 */

import { useState } from "react";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import type { EnemyDoc } from "@/types";
import type { HomebrewTabId } from "./HomebrewTabs";
import HomebrewItemCard from "./HomebrewItemCard";
import HomebrewItemDetailModal from "./HomebrewItemDetailModal";
import HomebrewSpellCard from "./HomebrewSpellCard";
import HomebrewSpellDetailModal from "./HomebrewSpellDetailModal";
import HomebrewFeatCard from "./HomebrewFeatCard";
import HomebrewFeatDetailModal from "./HomebrewFeatDetailModal";
import HomebrewEnemyCard from "./HomebrewEnemyCard";
import HomebrewEnemyDetailModal from "./HomebrewEnemyDetailModal";
import HomebrewEmptyState from "./HomebrewEmptyState";

interface HomebrewTabPanelProps {
  activeTab: HomebrewTabId;
  items: HomebrewItem[];
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
  enemies: EnemyDoc[];
  onEditItem: (item: HomebrewItem) => void;
  onEditSpell: (spell: HomebrewSpell) => void;
  onEditFeat: (feat: HomebrewFeat) => void;
  onEditEnemy: (enemy: EnemyDoc) => void;
  onDeleteItem: (id: string) => void;
  onDeleteSpell: (id: string) => void;
  onDeleteFeat: (id: string) => void;
  onDeleteEnemy: (id: string) => void;
  onDuplicateItem: (item: HomebrewItem) => void;
  onDuplicateSpell: (spell: HomebrewSpell) => void;
  onDuplicateFeat: (feat: HomebrewFeat) => void;
  onDuplicateEnemy: (enemy: EnemyDoc) => void;
  onToggleItemVisibility: (id: string, visible: boolean) => void;
  onToggleSpellVisibility: (id: string, visible: boolean) => void;
  onToggleFeatVisibility: (id: string, visible: boolean) => void;
  onToggleEnemyVisibility: (id: string, visible: boolean) => void;
  isBulkMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export default function HomebrewTabPanel({
  activeTab,
  items, spells, feats, enemies,
  onEditItem, onEditSpell, onEditFeat, onEditEnemy,
  onDeleteItem, onDeleteSpell, onDeleteFeat, onDeleteEnemy,
  onDuplicateItem, onDuplicateSpell, onDuplicateFeat, onDuplicateEnemy,
  onToggleItemVisibility, onToggleSpellVisibility, onToggleFeatVisibility, onToggleEnemyVisibility,
  isBulkMode, selectedIds, onToggleSelect,
}: HomebrewTabPanelProps) {
  const baseDelay = 50;
  const [detailItem, setDetailItem] = useState<HomebrewItem | null>(null);
  const [detailSpell, setDetailSpell] = useState<HomebrewSpell | null>(null);
  const [detailFeat, setDetailFeat] = useState<HomebrewFeat | null>(null);
  const [detailEnemy, setDetailEnemy] = useState<EnemyDoc | null>(null);

  if (activeTab === "items") {
    if (items.length === 0) return <HomebrewEmptyState tabLabel="items" />;
    return (
      <>
        <HomebrewItemDetailModal item={detailItem!} isOpen={!!detailItem} onClose={() => setDetailItem(null)} />
        <div style={{ animation: "slide-in-up 0.3s ease-out both" }}>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(items.indexOf(item) * 25, 600)}ms both` }}>
                <HomebrewItemCard
                  item={item}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item.id)}
                  onDuplicate={() => onDuplicateItem(item)}
                  onToggleVisibility={(id, visible) => onToggleItemVisibility(id, visible)}
                  onViewDetail={setDetailItem}
                  isBulkMode={isBulkMode}
                  isSelected={selectedIds?.has(item.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (activeTab === "spells") {
    if (spells.length === 0) return <HomebrewEmptyState tabLabel="spells" />;
    return (
      <>
        <HomebrewSpellDetailModal spell={detailSpell!} isOpen={!!detailSpell} onClose={() => setDetailSpell(null)} />
        <div style={{ animation: "slide-in-up 0.3s ease-out 0.05s both" }}>
          <div className="space-y-2">
            {spells.map((spell) => (
              <div key={spell.id} style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(spells.indexOf(spell) * 25, 600)}ms both` }}>
                <HomebrewSpellCard
                  spell={spell}
                  onEdit={() => onEditSpell(spell)}
                  onDelete={() => onDeleteSpell(spell.id)}
                  onDuplicate={() => onDuplicateSpell(spell)}
                  onToggleVisibility={(id, visible) => onToggleSpellVisibility(id, visible)}
                  onViewDetail={setDetailSpell}
                  isBulkMode={isBulkMode}
                  isSelected={selectedIds?.has(spell.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (activeTab === "feats") {
    if (feats.length === 0) return <HomebrewEmptyState tabLabel="feats" />;
    return (
      <>
        <HomebrewFeatDetailModal feat={detailFeat!} isOpen={!!detailFeat} onClose={() => setDetailFeat(null)} />
        <div style={{ animation: "slide-in-up 0.3s ease-out 0.1s both" }}>
          <div className="space-y-2">
            {feats.map((feat) => (
              <div key={feat.id} style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(feats.indexOf(feat) * 25, 600)}ms both` }}>
                <HomebrewFeatCard
                  feat={feat}
                  onEdit={() => onEditFeat(feat)}
                  onDelete={() => onDeleteFeat(feat.id)}
                  onDuplicate={() => onDuplicateFeat(feat)}
                  onToggleVisibility={(id, visible) => onToggleFeatVisibility(id, visible)}
                  onViewDetail={setDetailFeat}
                  isBulkMode={isBulkMode}
                  isSelected={selectedIds?.has(feat.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // enemies tab
  if (enemies.length === 0) return <HomebrewEmptyState tabLabel="enemies" />;
  return (
    <>
      <HomebrewEnemyDetailModal enemy={detailEnemy!} isOpen={!!detailEnemy} onClose={() => setDetailEnemy(null)} />
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.15s both" }}>
        <div className="space-y-2">
          {enemies.map((enemy) => (
            <div key={enemy.id} style={{ animation: `slide-in-up 0.35s ease-out ${baseDelay + Math.min(enemies.indexOf(enemy) * 25, 600)}ms both` }}>
              <HomebrewEnemyCard
                enemy={enemy}
                onEdit={() => onEditEnemy(enemy)}
                onDelete={() => onDeleteEnemy(enemy.id)}
                onDuplicate={() => onDuplicateEnemy(enemy)}
                onToggleVisibility={(id, visible) => onToggleEnemyVisibility(id, visible)}
                onViewDetail={setDetailEnemy}
                isBulkMode={isBulkMode}
                isSelected={selectedIds?.has(enemy.id)}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
