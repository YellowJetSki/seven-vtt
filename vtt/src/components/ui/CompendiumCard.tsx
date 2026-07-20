/**
 * STᚱ VTT — Compendium Card (Premium Lusion/Spotify Edition v3)
 *
 * Premium card for items, spells, and feats in the compendium with:
 * - Glass gradient base with edge light + hover glow
 * - Gold border hover elevation (-translate-y-0.5)
 * - Staggered entrance via animation-delay
 * - Source badge (SRD / Homebrew) with proper token color
 * - Drag indicator cursor + gripper icon on hover
 * - Type-specific icons (item category, spell school, feat)
 * - Rarity/tier chip with consistent color mapping
 * - Expanded/collapsed description toggle
 * - Meta chip strip (category, attunement, weight, value, etc.)
 * - Directional hover glow sweep (Lusion-style)
 * - Consistent with premium design system glass tokens
 */

import { useState } from "react";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import { rarityColor } from "@/stores/compendium";

type CompendiumEntry =
  | { type: "item"; data: HomebrewItem }
  | { type: "spell"; data: HomebrewSpell }
  | { type: "feat"; data: HomebrewFeat };

interface CompendiumCardProps {
  entry: CompendiumEntry;
  onDragStart?: (entry: CompendiumEntry) => void;
  index?: number;
}

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

export default function CompendiumCard({ entry, onDragStart, index = 0 }: CompendiumCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!onDragStart) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: entry.type, id: entry.data.id }));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(entry);
  };

  const cardClass =
    "group relative bg-gradient-to-b from-[#14151f]/70 to-[#0f101a]/80 border border-white/[0.04] rounded-xl p-3 " +
    "cursor-default hover:border-gold-500/15 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(234,179,8,0.06)] " +
    "active:scale-[0.99] transition-all duration-200 overflow-hidden";

  const gripClass = "text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs -mr-1 mt-1";

  // ── Item Card ──
  if (entry.type === "item") {
    const item = entry.data;
    const icon = CATEGORY_ICONS[item.category] ?? "📦";

    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onClick={() => setExpanded(!expanded)}
        className={cardClass}
        style={{ animationDelay: `${index * 30}ms`, animation: "slide-in-up 0.3s ease-out both" }}
      >
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {/* Hover directional glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02] rounded-xl" />

        <div className="flex items-start gap-3 relative z-[1]">
          {/* Icon container */}
          <div className="w-9 h-9 rounded-lg bg-gold-500/5 border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-gold-500/10 group-hover:border-gold/10 transition-all duration-200">
            <span className="text-base" aria-hidden="true">{icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">{item.name}</span>
              <SourceBadge source={(item as any).sourceType} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${rarityColor(item.rarity)}`}>
                {item.rarity}
              </span>
            </div>

            <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${expanded ? "" : "line-clamp-2"}`}>
              {item.description}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[9px] uppercase tracking-wider bg-surface-700/30 text-surface-400 px-1.5 py-0.5 rounded font-medium">{item.category}</span>
              {item.requiresAttunement && <span className="text-[9px] text-gold-400 font-medium flex items-center gap-0.5">⚡ Attunement</span>}
              <span className="text-[9px] text-surface-500">{item.weight} lb</span>
              <span className="text-[9px] text-gold-500/70">{item.value} gp</span>
            </div>
          </div>

          {onDragStart && <span className={gripClass}>⠿</span>}
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
        className={cardClass}
        style={{ animationDelay: `${index * 30}ms`, animation: "slide-in-up 0.3s ease-out both" }}
      >
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02] rounded-xl" />

        <div className="flex items-start gap-3 relative z-[1]">
          <div className={`w-9 h-9 rounded-lg border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-white/[0.03] transition-all duration-200`}>
            <span className="text-base" aria-hidden="true">{schoolIcon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">{spell.name}</span>
              <SourceBadge source={(spell as any).sourceType} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${schoolColor}`}>
                {spell.level === 0 ? "Cantrip" : `Lv.${spell.level}`}
              </span>
            </div>

            <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${expanded ? "" : "line-clamp-2"}`}>
              {spell.description}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] uppercase tracking-wider bg-surface-700/30 px-1.5 py-0.5 rounded font-medium ${schoolColor}`}>{spell.school}</span>
              <span className="text-[9px] text-surface-500">{spell.castingTime}</span>
              <span className="text-[9px] text-surface-500">{spell.range}</span>
              {spell.concentration && <span className="text-[9px] text-gold-400 flex items-center gap-0.5">⟐ Conc.</span>}
              {spell.ritual && <span className="text-[9px] text-violet-400 flex items-center gap-0.5">◎ Ritual</span>}
              <span className="text-[9px] text-surface-500 font-mono">{spell.components.join("")}</span>
            </div>
          </div>

          {onDragStart && <span className={gripClass}>⠿</span>}
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
      className={cardClass}
      style={{ animationDelay: `${index * 30}ms`, animation: "slide-in-up 0.3s ease-out both" }}
    >
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02] rounded-xl" />

      <div className="flex items-start gap-3 relative z-[1]">
        <div className="w-9 h-9 rounded-lg bg-gold-500/5 border border-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-gold-500/10 group-hover:border-gold/10 transition-all duration-200">
          <span className="text-base" aria-hidden="true">🏅</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate max-w-[160px]">{feat.name}</span>
            <SourceBadge source={(feat as any).sourceType} />
          </div>

          <p className={`text-xs text-surface-500 mt-1 transition-all duration-200 ${expanded ? "" : "line-clamp-2"}`}>
            {feat.description}
          </p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {feat.prerequisites.length > 0 && (
              <span className="text-[9px] uppercase tracking-wider bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-medium">Prereqs</span>
            )}
            {feat.benefits.slice(0, 2).map((b, i) => (
              <span key={i} className="text-[9px] text-amber-400/70 flex items-center gap-0.5">✦ {b}</span>
            ))}
            {feat.benefits.length > 2 && <span className="text-[9px] text-surface-500">+{feat.benefits.length - 2} more</span>}
          </div>
        </div>

        {onDragStart && <span className={gripClass}>⠿</span>}
      </div>
    </div>
  );
}
