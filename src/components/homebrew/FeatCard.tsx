import type { HomebrewFeat } from "@/types/homebrew";

/* ── Props ── */
interface FeatCardProps {
  feat: HomebrewFeat;
  onEdit: (feat: HomebrewFeat) => void;
  onDelete: (id: string) => void;
}

/* ── Component ── */
export function FeatCard({ feat, onEdit, onDelete }: FeatCardProps) {
  return (
    <div className="group relative rounded-xl border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⭐</span>
            <h3 className="text-sm font-semibold text-surface-100">{feat.name}</h3>
          </div>
          {feat.repeatable && (
            <span className="text-[10px] text-accent-400">(Repeatable)</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(feat)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200"
            aria-label="Edit feat"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(feat.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-warrior-400 hover:bg-warrior-500/10"
            aria-label="Delete feat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Prerequisites */}
      {feat.prerequisites.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-medium text-surface-500 uppercase">Prerequisites</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {feat.prerequisites.map((pr, i) => (
              <span
                key={i}
                className="rounded-md bg-warrior-500/10 px-2 py-0.5 text-[10px] text-warrior-400"
              >
                {pr.description}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="mt-2 text-xs text-surface-400 line-clamp-2">
        {feat.description}
      </p>

      {/* Benefits */}
      {feat.benefits.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {feat.benefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-surface-300">
              <span className="mt-0.5 text-rogue-400">•</span>
              <span className="line-clamp-1">{benefit}</span>
            </li>
          ))}
          {feat.benefits.length > 3 && (
            <li className="text-[10px] text-surface-500 ml-4">
              +{feat.benefits.length - 3} more benefits
            </li>
          )}
        </ul>
      )}

      {/* Tags */}
      {feat.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {feat.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-800 px-2 py-0.5 text-[9px] text-surface-500"
            >
              {tag}
            </span>
          ))}
          {feat.tags.length > 3 && (
            <span className="text-[9px] text-surface-600">+{feat.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Source */}
      <p className="mt-2 text-[10px] text-surface-600">
        {feat.source}
      </p>
    </div>
  );
}
