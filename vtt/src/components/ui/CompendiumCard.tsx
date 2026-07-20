/**
 * STᚱ VTT — CompendiumCard (Premium)
 *
 * Premium card for items, spells, and feats in the compendium.
 * Features:
 * - Gold border hover glow with elevation (group)
 * - Staggered entrance animation via style animationDelay
 * - Source badge (SRD / Homebrew) with proper token color
 * - Drag indicator cursor on hover
 * - Type-specific icons per category/school/feat
 * - Compact content layout with meta chips
 *
 * Fully self-contained — no external dependencies beyond types.
 */

import { useState } from "react";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import { rarityColor } from "@/stores/compendium";

// ── Type Definitions ──

type CompendiumEntry =
  | { type: "item"; data: HomebrewItem }
  | { type: "spell"; data: HomebrewSpell }
  | { type: "feat"; data: HomebrewFeat };

interface CompendiumCardProps {
  entry: CompendiumEntry;
  onDragStart?: (entry: CompendiumEntry) => void;
  index?: number; // for staggered animation
}

// ── Icons & Colors ──

const CATEGORY_ICONS: Record<string, string> = {
  weapon: "⚔", armor: "🛡", potion: "🧪", scroll: "📜", wand: "🪄",
  ring: "💍", wondrous: "✨", tool: "🔧", ammunition: "🏹",
  food: "🍖", poison: "☠", other: "📦",
};

const SCHOOL_ICONS: Record<string, string> = {
  Abjuration: "🛡", Conjuration: "✨", Divination: "👁",
  Enchantment: "💫", Evocation: "💥", Illusion: "🌀",
  Necromancy: "💀", Transmutation: "🔨",
};

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "text-sky-400", Conjuration: "text-gold-400",
  Divination: "text-violet-400", Enchantment: "text-pink-400",
  Evocation: "text-rose-400", Illusion: "text-amber-300",
  Necromancy: "text-surface-400", Transmutation: "text-emerald-400",
};

// ── Sub-components ──

function SourceBadge({ source }: { source?: string | null }) {
  if (!source || source === "srd") return null;
  const colors: Record<string, string> = {
    homebrew: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    character: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    synthetic: "bg-sky-500/10 text-sky-400 border-sky-500/15",
  };
  const c = colors[source] ?? "bg-surface-700/40 text-surface-400 border-surface-600/20";
  const labels: Record<string, string> = {
    homebrew: "⚒ HB",
    character: "👤 PC",
    synthetic: "🔮 Inferred",
  };
  return (
    <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded border ${c}`}>
      {labels[source] ?? source}
    </span>
  );
}

// ── Main Component ──

export default function CompendiumCard({ entry, onDragStart, index = 0 }: CompendiumCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!onDragStart) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: entry.type, id: entry.data.id }));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(entry);
  };

  // ── Item Card ──
  if (entry.type === "item") {
    const item = entry.data;
    const icon = CATEGORY_ICONS[item.category] ?? "📦";
    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onClick={() => setExpanded(!expanded)}
        className="group bg-gradient-to-b from-[#14151f]/60 to-[#0f101a]/70 border border-white/[0.04] rounded-xl p-3
          cursor-default hover:border-gold-500/15 hover:shadow-[0_4px_20px_rgba(234,179,8,0.04)]
          transition-all duration-200 active:scale-[0.99]"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-start gap-3">
          {/* Icon with container */}
          <div className="w-9 h-9 rounded-lg bg-gold-500/5 border border-white/[0.04] flex items-center justify-center shrink-0
            group-hover:bg-gold-500/10 transition-all duration-200">
            <span className="text-base" aria-hidden="true">{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name + Rarity row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">
                {item.name}
              </span>
              <SourceBadge source={(item as any).sourceType} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${rarityColor(item.rarity)}`}>
                {item.rarity}
              </span>
            </div>

            {/* Description */}
            <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${
              expanded ? "" : "line-clamp-2"
            }`}>
              {item.description}
            </p>

            {/* Meta chips */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[9px] uppercase tracking-wider bg-surface-700/30 text-surface-400 px-1.5 py-0.5 rounded font-medium">
                {item.category}
              </span>
              {item.requiresAttunement && (
                <span className="text-[9px] text-gold-400 font-medium flex items-center gap-0.5">
                  ⚡ Attunement
                </span>
              )}
              <span className="text-[9px] text-surface-500">{item.weight} lb</span>
              <span className="text-[9px] text-gold-500/70">{item.value} gp</span>
            </div>
          </div>

          {/* Drag hint icon — visible on hover */}
          {onDragStart && (
            <span className="text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs -mr-1 mt-1">
              ⠿
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Spell Card ──
  if (entry.type === "spell") {
    const spell = entry.data;
    const schoolColor = SCHOOL_COLORS[spell.school] ?? "text-surface-400";
    const schoolIcon = SCHOOL_ICONS[spell.school] ?? "🔮";
    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onClick={() => setExpanded(!expanded)}
        className="group bg-gradient-to-b from-[#14151f]/60 to-[#0f101a]/70 border border-white/[0.04] rounded-xl p-3
          cursor-default hover:border-gold-500/15 hover:shadow-[0_4px_20px_rgba(234,179,8,0.04)]
          transition-all duration-200 active:scale-[0.99]"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-start gap-3">
          {/* School icon container */}
          <div className={`w-9 h-9 rounded-lg border border-white/[0.04] flex items-center justify-center shrink-0
            group-hover:bg-white/[0.03] transition-all duration-200`}>
            <span className="text-base" aria-hidden="true">{schoolIcon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">
                {spell.name}
              </span>
              <SourceBadge source={(spell as any).sourceType} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${schoolColor}`}>
                {spell.level === 0 ? "Cantrip" : `Lv.${spell.level}`}
              </span>
            </div>

            <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${
              expanded ? "" : "line-clamp-2"
            }`}>
              {spell.description}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] uppercase tracking-wider bg-surface-700/30 px-1.5 py-0.5 rounded font-medium ${schoolColor}`}>
                {spell.school}
              </span>
              <span className="text-[9px] text-surface-500">{spell.castingTime}</span>
              <span className="text-[9px] text-surface-500">{spell.range}</span>
              {spell.concentration && (
                <span className="text-[9px] text-gold-400 flex items-center gap-0.5">⟐ Conc.</span>
              )}
              {spell.ritual && (
                <span className="text-[9px] text-violet-400 flex items-center gap-0.5">◎ Ritual</span>
              )}
              <span className="text-[9px] text-surface-500 font-mono">
                {spell.components.join("")}
              </span>
            </div>
          </div>

          {onDragStart && (
            <span className="text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs -mr-1 mt-1">
              ⠿
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Feat Card ──
  const feat = entry.data;
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onClick={() => setExpanded(!expanded)}
      className="group bg-gradient-to-b from-[#14151f]/60 to-[#0f101a]/70 border border-white/[0.04] rounded-xl p-3
        cursor-default hover:border-gold-500/15 hover:shadow-[0_4px_20px_rgba(234,179,8,0.04)]
        transition-all duration-200 active:scale-[0.99]"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gold-500/5 border border-white/[0.04] flex items-center justify-center shrink-0
          group-hover:bg-gold-500/10 transition-all duration-200">
          <span className="text-base" aria-hidden="true">🏅</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">
              {feat.name}
            </span>
            <SourceBadge source={(feat as any).sourceType} />
          </div>

          <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${
            expanded ? "" : "line-clamp-2"
          }`}>
            {feat.description}
          </p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {feat.prerequisites.length > 0 && (
              <span className="text-[9px] uppercase tracking-wider bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-medium">
                Prereqs
              </span>
            )}
            {feat.benefits.slice(0, 2).map((b, i) => (
              <span key={i} className="text-[9px] text-amber-400/70 flex items-center gap-0.5">
                ✦ {b}
              </span>
            ))}
            {feat.benefits.length > 2 && (
              <span className="text-[9px] text-surface-500">
                +{feat.benefits.length - 2} more
              </span>
            )}
          </div>
        </div>

        {onDragStart && (
          <span className="text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs -mr-1 mt-1">
            ⠿
          </span>
        )}
      </div>
    </div>
  );
}
