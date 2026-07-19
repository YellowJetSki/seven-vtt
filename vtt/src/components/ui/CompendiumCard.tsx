import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import { rarityColor } from "@/stores/compendium";

type CompendiumEntry =
  | { type: "item"; data: HomebrewItem }
  | { type: "spell"; data: HomebrewSpell }
  | { type: "feat"; data: HomebrewFeat };

interface CompendiumCardProps {
  entry: CompendiumEntry;
  onDragStart?: (entry: CompendiumEntry) => void;
}

const categoryIcons: Record<string, string> = {
  weapon: "⚔", armor: "🛡", potion: "🧪", scroll: "📜", wand: "🪄",
  ring: "💍", wondrous: "✨", tool: "🔧", ammunition: "🏹",
  food: "🍖", poison: "☠", other: "📦",
};

const schoolColors: Record<string, string> = {
  Abjuration: "text-mage-400", Conjuration: "text-gold-400",
  Divination: "text-divine-400", Enchantment: "text-warrior-400",
  Evocation: "text-warrior-300", Illusion: "text-gold-300",
  Necromancy: "text-surface-400", Transmutation: "text-rogue-400",
};

export default function CompendiumCard({ entry, onDragStart }: CompendiumCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!onDragStart) return;
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: entry.type, id: entry.data.id }));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(entry);
  };

  if (entry.type === "item") {
    const item = entry.data;
    const icon = categoryIcons[item.category] ?? "📦";
    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        className="bg-obsidian-mid/50 border border-surface-700/20 rounded-xl p-3 cursor-default hover:border-gold/15 transition-all duration-200 active:scale-[0.99] group"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5" aria-hidden="true">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate">{item.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${rarityColor(item.rarity)}`}>
                {item.rarity}
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1 line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">
                {item.category}
              </span>
              {item.requiresAttunement && (
                <span className="text-[10px] text-gold-400 font-medium">⚡ Attunement</span>
              )}
              <span className="text-[10px] text-surface-500">{item.weight} lb</span>
              <span className="text-[10px] text-divine-400">{item.value} gp</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (entry.type === "spell") {
    const spell = entry.data;
    const schoolColor = schoolColors[spell.school] ?? "text-surface-400";
    return (
      <div
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        className="bg-obsidian-mid/50 border border-surface-700/20 rounded-xl p-3 cursor-default hover:border-gold/15 transition-all duration-200 active:scale-[0.99] group"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5 text-mage-400" aria-hidden="true">🔮</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-surface-200 truncate">{spell.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${schoolColor}`}>
                {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1 line-clamp-2">{spell.description}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">
                {spell.school}
              </span>
              <span className="text-[10px] text-surface-500">{spell.castingTime}</span>
              <span className="text-[10px] text-surface-500">{spell.range}</span>
              {spell.concentration && <span className="text-[10px] text-gold-400">⟐ Concentration</span>}
              {spell.ritual && <span className="text-[10px] text-rogue-400">◎ Ritual</span>}
              <span className="text-[10px] text-surface-400">{spell.components.join("")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const feat = entry.data;
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      className="bg-obsidian-mid/50 border border-surface-700/20 rounded-xl p-3 cursor-default hover:border-gold/15 transition-all duration-200 active:scale-[0.99] group"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5 text-divine-400" aria-hidden="true">🏅</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{feat.name}</span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{feat.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {feat.prerequisites.length > 0 && (
              <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-divine-400 px-1.5 py-0.5 rounded">
                Prerequisites
              </span>
            )}
            {feat.benefits.slice(0, 2).map((b, i) => (
              <span key={i} className="text-[10px] text-rogue-300">✦ {b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
