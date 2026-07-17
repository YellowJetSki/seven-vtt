/* ── DeleteConfirmModal ────────────────────────────────────────
 * Confirmation dialog for deleting a character.
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface Props {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ characterName, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-warrior-500/30 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <span className="text-4xl text-warrior-400">⚠️</span>
          <h3 className="mt-3 text-lg font-semibold text-surface-100">Remove Character?</h3>
          <p className="mt-2 text-sm text-surface-400">
            This will permanently delete <span className="font-semibold text-surface-200">{characterName}</span> from the campaign.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={onConfirm}>🗑️ Remove Character</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
