/* ── Sync Queue ────────────────────────────────────────────────
 * Persistent sync queue for Firebase writes with exponential backoff.
 * Queued pushes survive page reload via localStorage.
 * ─────────────────────────────────────────────────────────────── */

import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import {
  normalizedCampaign, normalizedCharacters, normalizedEnemies,
  normalizedEncounters, normalizedMaps, normalizedTokens, normalizedJournal,
  normalizedHomebrewItems, normalizedHomebrewSpells, normalizedHomebrewFeats,
  normalizedSessions, normalizedSessionCombatants, normalizedCombatLog,
} from "@/lib/normalized-firebase-service";
import type { CharacterDoc, EnemyDoc, EncounterDoc, MapTokenDoc, JournalEntryDoc, HomebrewItemDoc, HomebrewSpellDoc, HomebrewFeatDoc, SessionDoc, SessionCombatantDoc, CombatLogEntryDoc } from "@/types/firestore";

const QUEUE_KEY = "vtt-sync-queue-normalized";
const MAX_RETRIES = 5;
function getQueueCampaignId(): string {
  const meta = useCampaignStore.getState().meta;
  return meta?.id ?? "arkla";
}

interface QueuedPush {
  id: string;
  domain: "campaign" | "session" | "homebrew" | "character" | "enemy" | "encounter" | "map" | "token" | "journal" | "item" | "spell" | "feat" | "combatant" | "combatlog";
  entityId?: string;
  subId?: string;
  timestamp: number;
  retries: number;
}

function loadQueue(): QueuedPush[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedPush[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueuePush(domain: QueuedPush["domain"], entityId?: string, subId?: string): string {
  const queue = loadQueue();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, domain, entityId, subId, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
  return id;
}

function dequeuePush(id: string) {
  saveQueue(loadQueue().filter((q) => q.id !== id));
}

function incrementRetry(id: string): number {
  const queue = loadQueue();
  const entry = queue.find((q) => q.id === id);
  if (entry) {
    entry.retries += 1;
    entry.timestamp = Date.now();
    saveQueue(queue);
    return entry.retries;
  }
  return MAX_RETRIES + 1;
}

async function pushEntry(entry: QueuedPush): Promise<boolean> {
  const cid = getQueueCampaignId();
  switch (entry.domain) {
    case "campaign": {
      const meta = useCampaignStore.getState().meta;
      return meta ? await normalizedCampaign.pushMeta(cid, meta) : false;
    }
    case "character": {
      if (!entry.entityId) return false;
      const char = useCampaignStore.getState().characters.find((c) => c.id === entry.entityId);
      return char ? await normalizedCharacters.push(cid, char as unknown as CharacterDoc) : false;
    }
    case "enemy": {
      if (!entry.entityId) return false;
      const enemy = useCampaignStore.getState().enemies.find((e) => e.id === entry.entityId);
      return enemy ? await normalizedEnemies.push(cid, enemy) : false;
    }
    case "encounter": {
      if (!entry.entityId) return false;
      const enc = useCampaignStore.getState().encounters.find((e) => e.id === entry.entityId);
      return enc ? await normalizedEncounters.push(cid, enc as unknown as EncounterDoc) : false;
    }
    case "map": {
      if (!entry.entityId) return false;
      const map = useCampaignStore.getState().battleMaps.find((m) => m.id === entry.entityId);
      return map ? await normalizedMaps.push(cid, map) : false;
    }
    case "token": {
      if (!entry.entityId || !entry.subId) return false;
      const token = (useCampaignStore.getState().mapTokens[entry.entityId] ?? []).find((t) => t.id === entry.subId);
      return token ? await normalizedTokens.push(cid, entry.entityId, token as unknown as MapTokenDoc) : false;
    }
    case "journal": {
      if (!entry.entityId) return false;
      const journal = useCampaignStore.getState().journal.find((j) => j.id === entry.entityId);
      return journal ? await normalizedJournal.push(cid, journal as unknown as JournalEntryDoc) : false;
    }
    case "session": {
      const sessionState = useCombatStore.getState().liveSession;
      const activeEncounter = useCombatStore.getState().activeEncounter;
      const session: SessionDoc = {
        id: "current", name: `Session ${new Date().toLocaleDateString()}`,
        phase: sessionState.phase, startedAt: sessionState.sessionStartedAt, endedAt: null,
        currentScene: sessionState.currentScene, currentMapUrl: sessionState.currentMapUrl,
        dmAnnouncement: sessionState.dmAnnouncement, conditions: sessionState.conditions,
        activeEncounterId: activeEncounter?.id ?? null, createdAt: Date.now(), updatedAt: Date.now(),
      };
      return await normalizedSessions.push(cid, session);
    }
    case "combatant": {
      if (!entry.entityId) return false;
      const combatant = (useCombatStore.getState().activeEncounter?.combatants ?? []).find((c) => c.id === entry.entityId);
      return combatant ? await normalizedSessionCombatants.push(cid, "current", combatant as unknown as SessionCombatantDoc) : false;
    }
    case "combatlog": {
      if (!entry.entityId) return false;
      const logEntry = useCombatStore.getState().combatLog.find((l) => l.id === entry.entityId);
      return logEntry ? await normalizedCombatLog.push(cid, logEntry as unknown as CombatLogEntryDoc) : false;
    }
    case "item": {
      if (!entry.entityId) return false;
      const item = useHomebrewStore.getState().items.find((i) => i.id === entry.entityId);
      return item ? await normalizedHomebrewItems.push(cid, item as unknown as HomebrewItemDoc) : false;
    }
    case "spell": {
      if (!entry.entityId) return false;
      const spell = useHomebrewStore.getState().spells.find((s) => s.id === entry.entityId);
      return spell ? await normalizedHomebrewSpells.push(cid, spell as unknown as HomebrewSpellDoc) : false;
    }
    case "feat": {
      if (!entry.entityId) return false;
      const feat = useHomebrewStore.getState().feats.find((f) => f.id === entry.entityId);
      return feat ? await normalizedHomebrewFeats.push(cid, feat as unknown as HomebrewFeatDoc) : false;
    }
    default:
      return false;
  }
}

export async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  const staleIds: string[] = [];

  for (const entry of queue) {
    if (entry.retries >= MAX_RETRIES) {
      staleIds.push(entry.id);
      continue;
    }
    try {
      const ok = await pushEntry(entry);
      if (ok) dequeuePush(entry.id);
      else incrementRetry(entry.id);
    } catch {
      incrementRetry(entry.id);
    }
  }

  for (const id of staleIds) dequeuePush(id);
}
