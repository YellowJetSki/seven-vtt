/* ── Conditions Reference Panel ────────────────────────────────
 * Quick reference for all D&D 5e conditions and DC benchmarks.
 * Floating panel accessible from the combat view.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { STATUS_EFFECTS, DC_REFERENCES } from "@/data/statusEffects";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Tab = "conditions" | "dc";

export function ConditionsReferencePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("conditions");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="fixed right-0 top-[calc(33%+48px)] z-30 flex items-center gap-1.5 rounded-l-lg border border-r-0 border-surface-700 bg-surface-850 px-2.5 py-3 text-xs font-medium text-surface-400 shadow-lg transition-all hover:bg-surface-700 hover:text-surface-200"
        title="Conditions & DC Reference"
      >
        <span className="text-base">🛡️</span>
        <span className={isMobile ? "hidden" : "block"}>{isOpen ? "Close" : "Rules"}</span>
      </button>

      {/* Overlay (mobile) */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={toggleOpen} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-surface-700 bg-surface-850 shadow-2xl transition-all duration-300 ${
          isOpen ? "w-full sm:w-[400px] translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-surface-100">🛡️ Rules Reference</h3>
          <button
            onClick={toggleOpen}
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-surface-200"
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-surface-700">
          <button
            onClick={() => setActiveTab("conditions")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "conditions"
                ? "border-b-2 border-accent-500 text-accent-300 bg-accent-500/5"
                : "text-surface-500 hover:text-surface-300"
            }`}
          >
            Conditions
          </button>
          <button
            onClick={() => setActiveTab("dc")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "dc"
                ? "border-b-2 border-accent-500 text-accent-300 bg-accent-500/5"
                : "text-surface-500 hover:text-surface-300"
            }`}
          >
            DC Reference
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === "conditions" ? (
            Object.values(STATUS_EFFECTS).map((effect) => (
              <div
                key={effect.id}
                className="rounded-lg border border-surface-700 bg-surface-800 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{effect.icon}</span>
                  <h4 className="text-sm font-semibold text-surface-200" style={{ color: effect.color }}>
                    {effect.label}
                  </h4>
                </div>
                <p className="text-xs text-surface-400 leading-relaxed">{effect.description}</p>
              </div>
            ))
          ) : (
            DC_REFERENCES.map((section) => (
              <div key={section.category} className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400 sticky top-0 bg-surface-850 py-1">
                  {section.category}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-md bg-surface-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-surface-200">{item.label}</p>
                        <p className="text-[10px] text-surface-500">{item.description}</p>
                      </div>
                      <span className="rounded-md bg-accent-500/10 px-2 py-1 text-sm font-bold text-accent-400">
                        DC {item.dc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-700 px-4 py-2 text-center text-[10px] text-surface-600">
          D&D 5e Quick Reference
        </div>
      </div>
    </>
  );
}
