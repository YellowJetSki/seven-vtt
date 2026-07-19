/**
 * STᚱ VTT — Toolbar Divider
 *
 * Thin vertical divider for use in toolbars to separate logical groups.
 */

export default function ToolbarDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`h-5 w-px bg-surface-600/20 mx-0.5 ${className}`} />
  );
}
