/* ── Obelisk Detail Panel ──────────────────────────────────────
 * Side-panel for inspecting a single obelisk. Composed of
 * extracted sub-component sections to maintain the <150 line limit.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { Obelisk, ObeliskState } from "@/types/obelisks";
import { OBELISK_NAMES, OBELISK_AFFINITIES, AFFINITY_COLORS } from "@/types/obelisks";
import { ObeliskDetailStateSection } from "./ObeliskDetailStateSection";
import { ObeliskDetailCorruption } from "./ObeliskDetailCorruption";
import { ObeliskDetailLore } from "./ObeliskDetailLore";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskDetailPanelProps {
  obelisk: Obelisk;
  onSetState: (id: string, state: ObeliskState) => void;
  onAdvanceState: (id: string) => void;
  onSetCorruption: (id: string, level: number) => void;
  onRevealFragment: (obeliskId: string, fragmentId: string) => void;
  onSetDmNotes: (id: string, notes: string) => void;
  onClose: () => void;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskDetailPanel({
  obelisk,
  onSetState,
  onAdvanceState,
  onSetCorruption,
  onRevealFragment,
  onSetDmNotes,
  onClose,
}: ObeliskDetailPanelProps) {
  const [dmNotes, setDmNotes] = useState(obelisk.dmNotes);

  const affinity = OBELISK_AFFINITIES[obelisk.id];
  const color = AFFINITY_COLORS[affinity];

  const handleNotesSave = () => {
    onSetDmNotes(obelisk.id, dmNotes);
  };

  return (
    <div className="flex h-full flex-col bg-surface-850 p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-bold text-surface-100 truncate">
              {OBELISK_NAMES[obelisk.id]}
            </h3>
          </div>
          <p className="mt-0.5 text-[10px] text-surface-500 uppercase tracking-wider">
            {obelisk.aliases.slice(0, 2).join(" · ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-surface-500 hover:text-surface-200 hover:bg-surface-700/50 transition-all"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <ObeliskDetailStateSection
          obelisk={obelisk}
          onSetState={onSetState}
          onAdvanceState={onAdvanceState}
        />

        <ObeliskDetailCorruption
          obelisk={obelisk}
          onSetCorruption={onSetCorruption}
        />

        {/* Attunement Charges */}
        <section>
          <p className="mb-2 text-[9px] uppercase tracking-wider text-surface-500">
            Attunement Charges
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: obelisk.maxAttunementCharges }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    i < obelisk.attunementCharges
                      ? "border-accent-400 bg-accent-500/30 shadow-sm shadow-accent-500/20"
                      : "border-surface-600 bg-surface-800"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-surface-400">
              {obelisk.attunementCharges}/{obelisk.maxAttunementCharges}
            </span>
          </div>
        </section>

        <ObeliskDetailLore
          obelisk={obelisk}
          onRevealFragment={onRevealFragment}
        />

        {/* DM Notes */}
        <section>
          <p className="mb-2 text-[9px] uppercase tracking-wider text-surface-500">DM Notes</p>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            placeholder="Private notes about this obelisk..."
            rows={4}
            className="w-full rounded-lg border border-surface-700/50 bg-surface-800/70 p-2 text-[10px] text-surface-200 placeholder:text-surface-600 focus:border-accent-500/30 focus:outline-none resize-none"
          />
          <button
            onClick={handleNotesSave}
            className="mt-1 rounded bg-accent-500/20 px-3 py-1 text-[9px] text-accent-300 hover:bg-accent-500/30 transition-all"
          >
            Save Notes
          </button>
        </section>

        {/* Map Position */}
        <section>
          <p className="mb-2 text-[9px] uppercase tracking-wider text-surface-500">Map Position</p>
          <div className="rounded-lg border border-surface-700/50 bg-surface-800/50 p-2">
            <p className="text-[10px] text-surface-400">
              X: {obelisk.mapPositionX}% · Y: {obelisk.mapPositionY}%
            </p>
            {obelisk.linkedMapId && (
              <p className="text-[10px] text-accent-400 mt-1">
                Linked to map: {obelisk.linkedMapId}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
