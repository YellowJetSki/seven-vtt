// ── Journal ───────────────────────────────────────────────────

export type JournalEntryType = "session" | "lore" | "quest" | "note" | "handout";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: JournalEntryType;
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}
