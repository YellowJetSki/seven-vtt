// ── Condition Data — Merged from parts ───────────────────────

import type { ConditionId, ConditionInfo } from "@/types";
import { CONDITIONS_PART1 } from "./condition-data-part1";
import { CONDITIONS_PART2 } from "./condition-data-part2";

export const CONDITIONS: Record<ConditionId, ConditionInfo> = {
  ...CONDITIONS_PART1,
  ...CONDITIONS_PART2,
} as Record<ConditionId, ConditionInfo>;
