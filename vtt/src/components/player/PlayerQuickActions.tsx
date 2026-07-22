/**
 * STᚱ VTT — Player Quick Actions Bar
 *
 * Always-visible favorites bar for frequently-used attacks, spells,
 * and abilities. Players can "star" items from their weapon/spell lists
 * to appear here. Saves to localStorage by character ID.
 */
import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";

interface PlayerQuickActionsProps {
  character: PlayerCharacter;
  /** Called when a favorite action is clicked */
  onAction: (actionName: string) => void;
  /** Available actions from the character (weapons, spells, items) */
  availableActions?: string[];
}

const FAVES_KEY = "str-vtt-faves";

function loadFaves(charId: string): string[] {
  try {
    const raw = localStorage.getItem(`${FAVES_KEY}-${charId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFaves(charId: string, faves: string[]) {
  localStorage.setItem(`${FAVES_KEY}-${charId}`, JSON.stringify(faves));
}

export default function PlayerQuickActions({ character, onAction, availableActions }: PlayerQuickActionsProps) {
  const [faves, setFaves] = useState<string[]>(() => loadFaves(character.id));
  const [showEditor, setShowEditor] = useState(false);

  const toggleFave = useCallback((name: string) => {
    setFaves((prev) => {
      const next = prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name];
      saveFaves(character.id, next);
      return next;
    });
  }, [character.id]);

  if (faves.length === 0 && !showEditor) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gold-500/5 border border-gold/10 rounded-lg">
        <span className="text-[9px] text-surface-500">⭐ No favorites — </span>
        <button
          onClick={() => setShowEditor(true)}
          className="text-[9px] text-gold-400/70 hover:text-gold-400 underline"
        >
          tap to add
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Favorites strip */}
      {faves.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {faves.map((name) => (
            <button
              key={name}
              onClick={() => onAction(name)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-gold-500/10 border border-gold/15 text-gold-300 hover:bg-gold-500/15 active:scale-95 transition-all"
            >
              <span>⭐</span>
              <span className="max-w-[80px] truncate">{name}</span>
            </button>
          ))}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="text-[9px] text-surface-500 hover:text-surface-400 px-1"
          >
            {showEditor ? "✓ Done" : "✎ Edit"}
          </button>
        </div>
      )}

      {/* Editor panel */}
      {showEditor && (
        <div className="bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-2 max-h-40 overflow-y-auto scrollbar-gold animate-in slide-in-from-top-1 duration-150">
          <div className="text-[9px] font-bold text-surface-400 mb-1 uppercase tracking-wider">Toggle favorites</div>
          {(!availableActions || availableActions.length === 0) ? (
            <div className="text-[9px] text-surface-500 italic px-2 py-1">Equip weapons or prepare spells to see them here</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {availableActions.map((name) => (
                <button
                  key={name}
                  onClick={() => toggleFave(name)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                    faves.includes(name)
                      ? "bg-gold-500/10 border-gold/20 text-gold-300"
                      : "bg-white/[0.02] border-white/[0.04] text-surface-400 hover:border-white/[0.08]"
                  }`}
                >
                  <span>{faves.includes(name) ? "⭐" : "☆"}</span>
                  <span className="max-w-[60px] truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
