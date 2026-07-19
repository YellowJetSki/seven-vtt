/**
 * STᚱ VTT — Inspector Footer
 *
 * Footer with save and delete actions for the token inspector.
 */

import Button from "@/components/ui/Button";

interface InspectorFooterProps {
  hasChanges: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export default function InspectorFooter({
  hasChanges,
  onSave,
  onDelete,
}: InspectorFooterProps) {
  return (
    <div className="shrink-0 border-t border-surface-700/20 px-4 py-3 space-y-2">
      <Button
        variant="arcane"
        size="sm"
        className="w-full"
        onClick={onSave}
        disabled={!hasChanges}
      >
        {hasChanges ? "✦ Apply Changes" : "✦ No Changes"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        onClick={onDelete}
      >
        ✕ Delete Token
      </Button>
    </div>
  );
}
