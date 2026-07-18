import { useState } from "react";
import GlobalCompendium from "@/components/ui/GlobalCompendium";

export default function CompendiumDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-accent-300 transition-all duration-200 group"
        aria-label="Toggle compendium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-500 rounded-full animate-pulse-soft" />
      </button>

      {/* Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 z-50 glass-arcane border-l border-accent-500/10 shadow-2xl shadow-accent-500/5 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-700/20">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <span className="font-black text-gradient-arcane">Compendium</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all duration-200"
              aria-label="Close compendium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <GlobalCompendium />
          </div>
        </div>
      </div>
    </>
  );
}
