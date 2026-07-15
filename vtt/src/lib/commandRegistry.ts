/* ── Command Registry ───────────────────────────────────────────
 * Central registry for the command palette.
 * Commands can be registered from any component.
 * ─────────────────────────────────────────────────────────────── */

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: "navigation" | "action" | "combat" | "session";
  action: () => void;
}

// Global command registry
const _commands: Command[] = [];

export function registerCommand(cmd: Command): void {
  _commands.push(cmd);
}

export function unregisterCommand(id: string): void {
  const idx = _commands.findIndex((c) => c.id === id);
  if (idx >= 0) _commands.splice(idx, 1);
}

export function getCommands(): Command[] {
  return [..._commands];
}

export function searchCommands(query: string): Command[] {
  if (!query.trim()) return [..._commands];
  const q = query.toLowerCase();
  return _commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q),
  );
}
