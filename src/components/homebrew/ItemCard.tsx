import type { HomebrewItem } from "@/types/homebrew";

/* ── Props ── */
interface ItemCardProps {
  item: HomebrewItem;
  onEdit: (item: HomebrewItem) => void;
  onDelete: (id: string) => void;
  onViewImage?: (url: string) => void;
}

/* ── Rarity colors ── */
const RARITY_COLORS: Record<string, string> = {
  common: "text-surface-400",
  uncommon: "text-rogue-400",
  rare: "text-mage-400",
  "very rare": "text-accent-400",
  legendary: "text-divine-400",
  artifact: "text-warrior-400",
  varies: "text-surface-300",
};

/* ── Category icons ── */
const CATEGORY_ICONS: Record<string, string> = {
  weapon: "⚔",
  armor: "🛡",
  potion: "🧪",
  scroll: "📜",
  wand: "🪄",
  ring: "💍",
  wondrous: "🔮",
  tool: "🔧",
  ammunition: "🏹",
  food: "🍞",
  poison: "☠",
  other: "📦",
};

/* ── Component ── */
export function ItemCard({ item, onEdit, onDelete, onViewImage }: ItemCardProps) {
  const rarityColor = RARITY_COLORS[item.rarity] ?? "text-surface-400";

  return (
    <div className="group relative rounded-xl border border-surface-700 bg-surface-850 transition-all hover:border-surface-600 hover:shadow-md">
      {/* Image Preview Strip */}
      {item.imageUrl && (
        <div
          className="relative h-32 cursor-pointer overflow-hidden rounded-t-xl bg-surface-800"
          onClick={() => onViewImage?.(item.imageUrl!)}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain p-2 transition-transform hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-850/60 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{CATEGORY_ICONS[item.category] ?? "📦"}</span>
              <h3 className="text-sm font-semibold text-surface-100 truncate">
                {item.name}
              </h3>
            </div>
            <p className={`mt-0.5 text-[11px] font-medium ${rarityColor}`}>
              {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
              {item.requiresAttunement && " (requires attunement)"}
              {item.isCursed && " · Cursed"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200"
              aria-label="Edit item"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-warrior-400 hover:bg-warrior-500/10"
              aria-label="Delete item"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category badge */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-surface-400 uppercase">
            {item.category}
          </span>
          {item.weaponData && (
            <>
              <span className="rounded-md bg-warrior-500/10 px-2 py-0.5 text-[10px] text-warrior-400">
                {item.weaponData.damageDice} {item.weaponData.damageType}
              </span>
              <span className="rounded-md bg-mage-500/10 px-2 py-0.5 text-[10px] text-mage-400">
                {item.weaponData.weaponType}
              </span>
            </>
          )}
          {item.armorData && (
            <span className="rounded-md bg-mage-500/10 px-2 py-0.5 text-[10px] text-mage-400">
              AC {item.armorData.baseAC}
              {item.armorData.isShield ? " (Shield)" : ` (${item.armorData.armorType})`}
            </span>
          )}
        </div>

        {/* Description Snippet */}
        <p className="mt-2 text-xs text-surface-400 line-clamp-2">
          {item.description}
        </p>

        {/* Weight & Value */}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-500">
          {item.weight > 0 && <span>{item.weight} lbs</span>}
          {item.value > 0 && <span>{item.value} gp</span>}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-800 px-2 py-0.5 text-[9px] text-surface-500"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span className="text-[9px] text-surface-600">+{item.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
