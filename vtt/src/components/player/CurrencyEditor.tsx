/* ── CurrencyEditor ────────────────────────────────────────────
 * Modal for editing a character's coin purse.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Currency {
  platinum: number; gold: number; electrum: number; silver: number; copper: number;
}

interface Props {
  currency: Currency;
  onSave: (currency: Currency) => void;
  onClose: () => void;
}

const COINS = ["platinum", "gold", "electrum", "silver", "copper"] as const;
const LABELS: Record<string, string> = {
  platinum: "PP", gold: "GP", electrum: "EP", silver: "SP", copper: "CP",
};

export function CurrencyEditor({ currency, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Currency>({ ...currency });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-surface-100 mb-4">Edit Currency</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {COINS.map((coin) => (
            <div key={coin} className="text-center">
              <label className="text-[10px] text-surface-400 uppercase block mb-1">{LABELS[coin]}</label>
              <input type="number" min={0} value={draft[coin]}
                onChange={(e) => setDraft(prev => ({ ...prev, [coin]: parseInt(e.target.value) || 0 }))}
                className="w-full rounded border border-surface-700 bg-surface-900 px-1 py-1 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(draft)}>Save Currency</Button>
        </div>
      </div>
    </div>
  );
}
