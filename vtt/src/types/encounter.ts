// ── Encounters ────────────────────────────────────────────────

export interface Encounter {
  id: string;
  name: string;
  description: string;
  environment: string;
  difficulty: string;
  isActive: boolean;
  enemyGroups: EnemyGroup[];
  createdAt: number;
  updatedAt: number;
}

export interface EnemyGroup {
  enemyId: string;
  count: number;
  label?: string;
}
