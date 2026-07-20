/**
 * STᚱ VTT — CharacterFormFields
 *
 * Character name and player name input fields for the creation modal.
 * Extracted from PlayerCreateModal.tsx monolith (Sprint 10 refactor).
 */

interface CharacterFormFieldsProps {
  name: string;
  onNameChange: (val: string) => void;
  playerName: string;
  onPlayerNameChange: (val: string) => void;
}

export default function CharacterFormFields({
  name,
  onNameChange,
  playerName,
  onPlayerNameChange,
}: CharacterFormFieldsProps) {
  return (
    <>
      {/* Character Name */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
          Character Name <span className="text-rose-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Aldric Stormwind"
          className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
          autoFocus
        />
      </div>

      {/* Player Name */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-1.5">
          Player Name
        </label>
        <input
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="e.g. Alice (optional)"
          className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
        />
      </div>
    </>
  );
}
