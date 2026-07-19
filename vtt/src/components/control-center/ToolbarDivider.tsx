/**
 * STᚱ VTT — Toolbar Divider (Premium Gold)
 *
 * Thin vertical divider for toolbars with gold tint.
 */

interface ToolbarDividerProps {
  className?: string;
}

export default function ToolbarDivider({ className = "" }: ToolbarDividerProps) {
  return <div className={`h-5 w-px bg-gold-500/10 mx-0.5 ${className}`} />;
}
