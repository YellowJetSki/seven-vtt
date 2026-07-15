/* ── DM Quick Reference Panel ────────────────────────────────── */

import { useState } from "react";
import { DC_REFERENCES, STATUS_EFFECTS } from "@/data/statusEffects";

/* ═══════════════════════════════════════════════════════════════
 * DM QUICK REFERENCE — Instant DC lookup & Condition Reference
 *
 * Features:
 *  • Tabbed: DC Reference | Conditions | Quick Notes
 *  • Pre-calculated DCs by category
 *  • Condition reference with descriptions
 *  • DM scratch pad for session notes
 * ═══════════════════════════════════════════════════════════════ */

type Tab = "dc" | "conditions" | "notes";

export function DmQuickReference() {
  const [tab, setTab] = useState<Tab>("dc");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [scratchNotes, setScratchNotes] = useState("");

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      {/* Tab Header */}
      <div className="flex border-b border-surface-700">
        {([
          { id: "dc" as Tab, label: "DC Reference", icon: "🎯" },
          { id: "conditions" as Tab, label: "Conditions", icon: "📋" },
          { id: "notes" as Tab, label: "Scratch Pad", icon: "📝" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2.5 text-center text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-accent-500 text-accent-300 bg-accent-500/5"
                : "text-surface-500 hover:text-surface-300 hover:bg-surface-800"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-3 max-h-[500px] overflow-y-auto">
        {/* ═══ DC Reference ═══ */}
        {tab === "dc" && (
          <div className="space-y-3">
            <p className="text-[11px] text-surface-500">
              Quick DC lookup for common situations. Tap a category to expand.
            </p>
            {DC_REFERENCES.map((group) => (
              <div key={group.category} className="rounded-lg border border-surface-700/50">
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === group.category ? null : group.category,
                    )
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-surface-200 hover:bg-surface-800 rounded-lg transition-colors"
                >
                  <span>{group.category}</span>
                  <span
                    className={`text-xs text-surface-500 transition-transform ${
                      expandedCategory === group.category ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {expandedCategory === group.category && (
                  <div className="border-t border-surface-700/50 px-3 py-2 space-y-1">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-md bg-surface-800 px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-surface-100">
                              {item.label}
                            </span>
                            <span className="text-lg font-bold text-accent-400">
                              DC {item.dc}
                            </span>
                          </div>
                          <p className="text-[11px] text-surface-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ Conditions ═══ */}
        {tab === "conditions" && (
          <div className="space-y-1">
            <p className="mb-2 text-[11px] text-surface-500">
              Full list of 5e conditions and status effects.
            </p>
            {Object.entries(STATUS_EFFECTS).map(([key, def]) => (
              <div
                key={key}
                className="rounded-lg border border-surface-700/50 bg-surface-800/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{def.icon}</span>
                  <span className="text-sm font-semibold text-surface-200" style={{ color: def.color }}>
                    {def.label}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-surface-400 leading-relaxed">
                  {def.description}
                </p>
                {def.save && (
                  <p className="mt-1 text-[11px] text-surface-500">
                    Save: {def.save}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ Scratch Pad ═══ */}
        {tab === "notes" && (
          <div className="space-y-3">
            <p className="text-[11px] text-surface-500">
              Session scratch pad. Notes persist in memory (not saved to campaign).
            </p>
            <textarea
              value={scratchNotes}
              onChange={(e) => setScratchNotes(e.target.value)}
              placeholder="Type your session notes here...
    • NPC names to remember
    • Improvised loot ideas
    • DCs you set on the fly
    • Player decisions to track"
              rows={12}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-surface-600">
              {scratchNotes.length} characters · Clear notes to reset
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
