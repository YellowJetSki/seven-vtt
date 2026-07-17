/* ── Character Export/Import Helpers ───────────────────────────
 * Export/import single or multiple characters as JSON files.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

export function exportCharacter(char: PlayerCharacter): void {
  const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${char.name.replace(/\s+/g, "-").toLowerCase()}-character.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAllCharacters(chars: PlayerCharacter[]): void {
  const blob = new Blob([JSON.stringify(chars, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `party-export-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCharacterFromFile(): Promise<PlayerCharacter> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { reject(new Error("No file selected")); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text) as PlayerCharacter;
        if (!data.name || !data.class) {
          if ("abilityScores" in data) reject(new Error("Old format detected — use the export from this app"));
          reject(new Error("Invalid character file: missing name/class."));
          return;
        }
        data.id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        data.createdAt = Date.now();
        data.updatedAt = Date.now();
        // Ensure flat ability scores
        const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
        for (const a of abilities) { if (!data[a]) data[a] = 10; }
        // Ensure flat currency (backward compat)
        if (!data.currency) {
          const old = data as Record<string, unknown>;
          data.currency = { copper: (old.copper as number) ?? 0, silver: (old.silver as number) ?? 0, electrum: (old.electrum as number) ?? 0, gold: (old.gold as number) ?? 0, platinum: (old.platinum as number) ?? 0 };
        }
        resolve(data);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse character file."));
      }
    };
    input.click();
  });
}

export function formatCurrency(char: PlayerCharacter, type: "cp" | "sp" | "ep" | "gp" | "pp"): number {
  const old = char as Record<string, unknown>;
  if (!char.currency) {
    switch (type) {
      case "cp": return (old.copper as number) ?? 0;
      case "sp": return (old.silver as number) ?? 0;
      case "ep": return (old.electrum as number) ?? 0;
      case "gp": return (old.gold as number) ?? 0;
      case "pp": return (old.platinum as number) ?? 0;
    }
  }
  switch (type) {
    case "cp": return char.currency.copper;
    case "sp": return char.currency.silver;
    case "ep": return char.currency.electrum;
    case "gp": return char.currency.gold;
    case "pp": return char.currency.platinum;
  }
}
