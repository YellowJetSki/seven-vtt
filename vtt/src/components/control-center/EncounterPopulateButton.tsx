/**
 * STᚱ VTT — Encounter Populate Button (Premium Gold)
 *
 * Gold-accented footer button for populating the map with a selected encounter.
 */

import Button from "@/components/ui/Button";

interface EncounterPopulateButtonProps {
  isPlacing: boolean;
  hasSelection: boolean;
  onPopulate: () => void;
}

export default function EncounterPopulateButton({
  isPlacing,
  hasSelection,
  onPopulate,
}: EncounterPopulateButtonProps) {
  return (
    <div className="shrink-0 border-t border-gold/10 px-3 py-2.5 space-y-2">
      <Button
        variant="gold"
        size="sm"
        className="w-full"
        onClick={onPopulate}
        disabled={!hasSelection}
        isLoading={isPlacing}
      >
        {isPlacing ? "✦ Placing..." : "✦ Populate Map with Encounter"}
      </Button>
      {!hasSelection && (
        <p className="text-[9px] text-gold-500/40 text-center">
          Select an encounter above
        </p>
      )}
    </div>
  );
}
