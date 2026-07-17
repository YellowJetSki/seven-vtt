/* ── EnemyPickerModal ──────────────────────────────────────────
 * Modal for searching and selecting enemies for encounter building.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { searchEnemies } from "@/data/enemy-database";
import type { EnemyTemplate } from "@/data/enemy-database";

interface Props {
  onSelect: (enemy: EnemyTemplate) => void;
  onClose: () => void;
}

export function EnemyPickerModal({ onSelect, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEnemies = useMemo(() => searchEnemies(searchQuery), [searchQuery]);

  return (
    <Modal modalId="enemy-picker" title="Add Enemy" size="md">
      <div className="space-y-3">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search enemies by name or type..." autoFocus
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredEnemies.map((template) => (
            <button key={template.id} onClick={() => onSelect(template)}
              className="flex w-full items-center justify-between rounded-lg bg-surface-800 px-3 py-2 text-left transition-colors hover:bg-surface-700">
              <div>
                <p className="text-sm font-medium text-surface-200">{template.name}</p>
                <p className="text-[10px] text-surface-500 capitalize">{template.type}{template.subType ? ` (${template.subType})` : ""}</p>
              </div>
              <div className="flex gap-2 text-[10px] text-surface-500">
                <span>CR {template.cr}</span><span>AC {template.ac}</span><span>HP {template.hp}</span>
              </div>
            </button>
          ))}
          {filteredEnemies.length === 0 && (
            <p className="py-4 text-center text-xs text-surface-500">No enemies match "{searchQuery}"</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
