/* ── Obelisk Detail: Lore Fragments Section ─────────────────────
 * Extracted from ObeliskDetailPanel.tsx to maintain <150 line limit.
 * Displays lore fragments for the selected obelisk, with reveal
 * toggles for fragments gated behind story progression.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import type { Obelisk, LoreFragment, ObeliskState } from "@/types/obelisks";
import { OBELISK_STATE_ORDER, getVisibleFragments } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskDetailLoreProps {
  obelisk: Obelisk;
  onRevealFragment: (obeliskId: string, fragmentId: string) => void;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskDetailLore({ obelisk, onRevealFragment }: ObeliskDetailLoreProps) {
  const [showAllFragments, setShowAllFragments] = useState(false);

  const visibleFragments = useMemo(
    () => getVisibleFragments(obelisk.loreFragments, obelisk.state),
    [obelisk.loreFragments, obelisk.state],
  );

  const displayed = showAllFragments ? obelisk.loreFragments : visibleFragments;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-wider text-surface-500">
          Lore Fragments
        </p>
        <button
          onClick={() => setShowAllFragments((v) => !v)}
          className="text-[9px] text-accent-400 hover:text-accent-300 transition-colors"
        >
          {showAllFragments ? "Hide locked" : "Show all"}
        </button>
      </div>

      <div className="space-y-2">
        {displayed.map((fragment) => (
          <LoreFragmentCard
            key={fragment.id}
            fragment={fragment}
            currentState={obelisk.state}
            onReveal={() => onRevealFragment(obelisk.id, fragment.id)}
          />
        ))}
        {obelisk.loreFragments.length === 0 && (
          <p className="text-[10px] text-surface-600 italic">No lore fragments yet.</p>
        )}
      </div>
    </section>
  );
}

/* ── Lore Fragment Card ──────────────────────────────────────── */

interface LoreFragmentCardProps {
  fragment: LoreFragment;
  currentState: ObeliskState;
  onReveal: () => void;
}

function LoreFragmentCard({ fragment, currentState, onReveal }: LoreFragmentCardProps) {
  const isUnlocked =
    OBELISK_STATE_ORDER.indexOf(fragment.requiredState) <=
    OBELISK_STATE_ORDER.indexOf(currentState);
  const fragmentStateIdx = OBELISK_STATE_ORDER.indexOf(fragment.requiredState);
  const currentStateIdx = OBELISK_STATE_ORDER.indexOf(currentState);

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        fragment.revealed
          ? "border-accent-500/30 bg-accent-500/5"
          : isUnlocked
            ? "border-surface-700/50 bg-surface-800/50"
            : "border-surface-800 bg-surface-900/50 opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-medium ${fragment.revealed ? "text-accent-300" : "text-surface-300"}`}
          >
            {fragment.revealed ? "📖" : "🔒"} {fragment.title}
          </p>
          {fragment.revealed && (
            <p className="mt-1 text-[10px] text-surface-400 leading-relaxed">
              {fragment.content}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {!fragment.revealed && isUnlocked && (
            <button
              onClick={onReveal}
              className="rounded bg-accent-500/20 px-2 py-1 text-[9px] text-accent-300 hover:bg-accent-500/30 transition-all"
            >
              Reveal
            </button>
          )}
          {!isUnlocked && (
            <span className="text-[9px] text-surface-600 whitespace-nowrap">
              State {fragmentStateIdx + 1}/{currentStateIdx + 1}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
