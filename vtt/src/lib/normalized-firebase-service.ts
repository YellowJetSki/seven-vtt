/* ── Normalized Firebase Sync Service ─────────────────────────
 *
 * Writes each entity to its own SUBCOLLECTION document.
 *
 * BENEFITS OVER MONOLITHIC DOC:
 * • No 1MB document size limit — each entity is its own doc
 * • Real-time updates for individual entities only (not the whole blob)
 * • Less merge conflicts on concurrent writes
 * • Clean Atomic writes for individual entities
 * • Scalable to 1000+ entities per campaign
 *
 * ── Write Pattern ────────────────────────────────────────────
 *   Each subcollection document stores:
 *     { data: <serialized_entity>, updatedAt: TIMESTAMP, updatedBy: USER_ID }
 *
 * ── Collection Layout ────────────────────────────────────────
 *   campaigns/{campaignId}                  → CampaignMeta (single doc)
 *   campaigns/{campaignId}/characters/{id}  → CharacterDoc
 *   campaigns/{campaignId}/enemies/{id}     → EnemyDoc
 *   campaigns/{campaignId}/encounters/{id}  → EncounterDoc
 *   campaigns/{campaignId}/maps/{id}        → MapDoc
 *   campaigns/{campaignId}/maps/{id}/tokens/{tokenId} → MapTokenDoc
 *   campaigns/{campaignId}/journal/{id}     → JournalEntryDoc
 *   campaigns/{campaignId}/sessions/{id}    → SessionDoc
 *   campaigns/{campaignId}/sessions/{id}/combatants/{cid} → SessionCombatantDoc
 *   campaigns/{campaignId}/combatLog/{id}   → CombatLogEntryDoc
 *   homebrew/items/{id}                     → HomebrewItemDoc (global)
 *   homebrew/spells/{id}                    → HomebrewSpellDoc (global)
 *   homebrew/feats/{id}                     → HomebrewFeatDoc (global)
 * ─────────────────────────────────────────────────────────────── */

import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { isFirebaseAvailable } from "@/lib/firebase";
import { Paths } from "@/types/firestore";
import type {
  CampaignMeta,
  CharacterDoc,
  EnemyDoc,
  EncounterDoc,
  MapDoc,
  MapTokenDoc,
  JournalEntryDoc,
  SessionDoc,
  SessionCombatantDoc,
  CombatLogEntryDoc,
  HomebrewItemDoc,
  HomebrewSpellDoc,
  HomebrewFeatDoc,
} from "@/types/firestore";

/* ── Types ──────────────────────────────────────────────────── */

export type SyncStatus = "idle" | "syncing" | "success" | "error";

/* ── Queue & Retry ──────────────────────────────────────────── */

interface QueueItem {
  key: string;
  action: () => Promise<boolean>;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RATE_LIMIT_MS = 500;

let pendingQueue: QueueItem[] = [];
let processingQueue = false;
let lastPushTime = 0;

async function processQueue(): Promise<void> {
  if (processingQueue || pendingQueue.length === 0) return;
  processingQueue = true;
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift()!;
    const elapsed = Date.now() - lastPushTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    try {
      lastPushTime = Date.now();
      const ok = await item.action();
      if (!ok && item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      } else if (!ok) {
        console.warn(`[NormalizedSync] Failed ${item.key} after ${MAX_RETRIES} retries.`);
      }
    } catch {
      if (item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      }
    }
  }
  processingQueue = false;
}

function enqueue(key: string, action: () => Promise<boolean>): void {
  pendingQueue.push({ key, action, timestamp: Date.now(), retries: 0 });
  processQueue();
}

/* ── Helpers ────────────────────────────────────────────────── */

function safeStringify<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getUserId(): string {
  return "dm@strvtt";
}

function getDbOrThrow(): Firestore {
  const db = getDb();
  if (!db) throw new Error("Firestore not initialized.");
  return db;
}

/* ── Generic Subcollection CRUD ─────────────────────────────── */

/**
 * Generic write to a specific document path.
 */
async function writeDoc(path: string, data: Record<string, unknown>): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    await setDoc(ref, { ...data, updatedAt: Date.now(), updatedBy: getUserId() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[NormalizedSync] writeDoc failed for ${path}:`, err);
    return false;
  }
}

/**
 * Generic delete of a document at a specific path.
 */
async function deleteDocAtPath(path: string): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error(`[NormalizedSync] deleteDoc failed for ${path}:`, err);
    return false;
  }
}

/**
 * Generic read of a single document.
 */
async function readDoc<T>(path: string): Promise<T | null> {
  if (!isFirebaseAvailable()) return null;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const raw = snap.data() as DocumentData;
      // Strip wrapper fields if present
      return (raw.data ?? raw) as T;
    }
    return null;
  } catch (err) {
    console.error(`[NormalizedSync] readDoc failed for ${path}:`, err);
    return null;
  }
}

/**
 * Generic read of all documents in a collection.
 */
async function readAllDocs<T>(collectionPath: string): Promise<T[]> {
  if (!isFirebaseAvailable()) return [];
  try {
    const db = getDbOrThrow();
    const ref = collection(db, collectionPath);
    const snap = await getDocs(ref);
    return snap.docs.map((d) => {
      const raw = d.data() as DocumentData;
      return (raw.data ?? raw) as T;
    });
  } catch (err) {
    console.error(`[NormalizedSync] readAllDocs failed for ${collectionPath}:`, err);
    return [];
  }
}

/**
 * Generic listener for a subcollection.
 * Calls onChange with the full array of documents.
 * Returns unsubscribe function.
 */
function listenCollection<T>(
  collectionPath: string,
  onChange: (items: T[]) => void,
  onError?: (error: string) => void,
): Unsubscribe | null {
  if (!isFirebaseAvailable()) return null;
  try {
    const db = getDbOrThrow();
    const ref = collection(db, collectionPath);
    const q = query(ref, orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = snapshot.docs.map((d) => {
          const raw = d.data() as DocumentData;
          return (raw.data ?? raw) as T;
        });
        onChange(items);
      },
      (error) => {
        console.error(`[NormalizedSync] Listener error for ${collectionPath}:`, error);
        onError?.(error.message);
      },
    );
    return unsub;
  } catch (err) {
    console.error(`[NormalizedSync] Failed to start listener for ${collectionPath}:`, err);
    onError?.(String(err));
    return null;
  }
}

/* ── Campaign Metadata ──────────────────────────────────────── */

export const normalizedCampaign = {
  async pushMeta(campaignId: string, meta: CampaignMeta): Promise<boolean> {
    return writeDoc(Paths.campaignMeta(campaignId), {
      data: safeStringify(meta),
    });
  },

  async fetchMeta(campaignId: string): Promise<CampaignMeta | null> {
    return readDoc<CampaignMeta>(Paths.campaignMeta(campaignId));
  },

  listenMeta(campaignId: string, onChange: (meta: CampaignMeta | null) => void, onError?: (err: string) => void): Unsubscribe | null {
    if (!isFirebaseAvailable()) return null;
    try {
      const db = getDbOrThrow();
      const ref = doc(db, Paths.campaignMeta(campaignId));
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const raw = snapshot.data() as DocumentData;
            onChange((raw.data ?? raw) as CampaignMeta);
          } else {
            onChange(null);
          }
        },
        (error) => {
          console.error(`[NormalizedSync] CampaignMeta listener error:`, error);
          onError?.(error.message);
        },
      );
      return unsub;
    } catch (err) {
      console.error(`[NormalizedSync] Failed to start campaignMeta listener:`, err);
      onError?.(String(err));
      return null;
    }
  },
};

/* ── Characters ─────────────────────────────────────────────── */

export const normalizedCharacters = {
  async push(campaignId: string, character: CharacterDoc): Promise<boolean> {
    return writeDoc(Paths.character(campaignId, character.id), {
      data: safeStringify(character),
    });
  },

  async remove(campaignId: string, charId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.character(campaignId, charId));
  },

  async fetchAll(campaignId: string): Promise<CharacterDoc[]> {
    return readAllDocs<CharacterDoc>(Paths.characters(campaignId));
  },

  listenAll(campaignId: string, onChange: (characters: CharacterDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<CharacterDoc>(Paths.characters(campaignId), onChange, onError);
  },
};

/* ── Enemies ────────────────────────────────────────────────── */

export const normalizedEnemies = {
  async push(campaignId: string, enemy: EnemyDoc): Promise<boolean> {
    return writeDoc(Paths.enemy(campaignId, enemy.id), {
      data: safeStringify(enemy),
    });
  },

  async remove(campaignId: string, enemyId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.enemy(campaignId, enemyId));
  },

  async fetchAll(campaignId: string): Promise<EnemyDoc[]> {
    return readAllDocs<EnemyDoc>(Paths.enemies(campaignId));
  },

  listenAll(campaignId: string, onChange: (enemies: EnemyDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<EnemyDoc>(Paths.enemies(campaignId), onChange, onError);
  },
};

/* ── Encounters ─────────────────────────────────────────────── */

export const normalizedEncounters = {
  async push(campaignId: string, encounter: EncounterDoc): Promise<boolean> {
    return writeDoc(Paths.encounter(campaignId, encounter.id), {
      data: safeStringify(encounter),
    });
  },

  async remove(campaignId: string, encounterId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.encounter(campaignId, encounterId));
  },

  async fetchAll(campaignId: string): Promise<EncounterDoc[]> {
    return readAllDocs<EncounterDoc>(Paths.encounters(campaignId));
  },

  listenAll(campaignId: string, onChange: (encounters: EncounterDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<EncounterDoc>(Paths.encounters(campaignId), onChange, onError);
  },
};

/* ── Maps ───────────────────────────────────────────────────── */

export const normalizedMaps = {
  async push(campaignId: string, map: MapDoc): Promise<boolean> {
    return writeDoc(Paths.map(campaignId, map.id), {
      data: safeStringify(map),
    });
  },

  async remove(campaignId: string, mapId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.map(campaignId, mapId));
  },

  async fetchAll(campaignId: string): Promise<MapDoc[]> {
    return readAllDocs<MapDoc>(Paths.maps(campaignId));
  },

  listenAll(campaignId: string, onChange: (maps: MapDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<MapDoc>(Paths.maps(campaignId), onChange, onError);
  },
};

/* ── Map Tokens ─────────────────────────────────────────────── */

export const normalizedTokens = {
  async push(campaignId: string, mapId: string, token: MapTokenDoc): Promise<boolean> {
    return writeDoc(Paths.token(campaignId, mapId, token.id), {
      data: safeStringify(token),
    });
  },

  async remove(campaignId: string, mapId: string, tokenId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.token(campaignId, mapId, tokenId));
  },

  async fetchAll(campaignId: string, mapId: string): Promise<MapTokenDoc[]> {
    return readAllDocs<MapTokenDoc>(Paths.tokens(campaignId, mapId));
  },

  listenAll(campaignId: string, mapId: string, onChange: (tokens: MapTokenDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<MapTokenDoc>(Paths.tokens(campaignId, mapId), onChange, onError);
  },
};

/* ── Journal ────────────────────────────────────────────────── */

export const normalizedJournal = {
  async push(campaignId: string, entry: JournalEntryDoc): Promise<boolean> {
    return writeDoc(Paths.journalEntry(campaignId, entry.id), {
      data: safeStringify(entry),
    });
  },

  async remove(campaignId: string, entryId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.journalEntry(campaignId, entryId));
  },

  async fetchAll(campaignId: string): Promise<JournalEntryDoc[]> {
    return readAllDocs<JournalEntryDoc>(Paths.journal(campaignId));
  },

  listenAll(campaignId: string, onChange: (entries: JournalEntryDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<JournalEntryDoc>(Paths.journal(campaignId), onChange, onError);
  },
};

/* ── Sessions ───────────────────────────────────────────────── */

export const normalizedSessions = {
  async push(campaignId: string, session: SessionDoc): Promise<boolean> {
    return writeDoc(Paths.session(campaignId, session.id), {
      data: safeStringify(session),
    });
  },

  async remove(campaignId: string, sessionId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.session(campaignId, sessionId));
  },

  async fetchAll(campaignId: string): Promise<SessionDoc[]> {
    return readAllDocs<SessionDoc>(Paths.sessions(campaignId));
  },

  listenAll(campaignId: string, onChange: (sessions: SessionDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<SessionDoc>(Paths.sessions(campaignId), onChange, onError);
  },
};

/* ── Session Combatants ─────────────────────────────────────── */

export const normalizedSessionCombatants = {
  async push(campaignId: string, sessionId: string, combatant: SessionCombatantDoc): Promise<boolean> {
    return writeDoc(Paths.sessionCombatant(campaignId, sessionId, combatant.id), {
      data: safeStringify(combatant),
    });
  },

  async remove(campaignId: string, sessionId: string, combatantId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.sessionCombatant(campaignId, sessionId, combatantId));
  },

  async fetchAll(campaignId: string, sessionId: string): Promise<SessionCombatantDoc[]> {
    return readAllDocs<SessionCombatantDoc>(Paths.sessionCombatants(campaignId, sessionId));
  },

  listenAll(campaignId: string, sessionId: string, onChange: (combatants: SessionCombatantDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<SessionCombatantDoc>(Paths.sessionCombatants(campaignId, sessionId), onChange, onError);
  },
};

/* ── Combat Log ─────────────────────────────────────────────── */

export const normalizedCombatLog = {
  async push(campaignId: string, entry: CombatLogEntryDoc): Promise<boolean> {
    return writeDoc(Paths.combatLogEntry(campaignId, entry.id), {
      data: safeStringify(entry),
    });
  },

  async remove(campaignId: string, entryId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.combatLogEntry(campaignId, entryId));
  },

  async fetchAll(campaignId: string): Promise<CombatLogEntryDoc[]> {
    return readAllDocs<CombatLogEntryDoc>(Paths.combatLog(campaignId));
  },

  listenAll(campaignId: string, onChange: (entries: CombatLogEntryDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<CombatLogEntryDoc>(Paths.combatLog(campaignId), onChange, onError);
  },
};

/* ── Homebrew Items ─────────────────────────────────────────── */

export const normalizedHomebrewItems = {
  async push(campaignId: string, item: HomebrewItemDoc): Promise<boolean> {
    return writeDoc(Paths.homebrewItem(campaignId, item.id), {
      data: safeStringify(item),
    });
  },

  async remove(campaignId: string, itemId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.homebrewItem(campaignId, itemId));
  },

  async fetchAll(campaignId: string): Promise<HomebrewItemDoc[]> {
    return readAllDocs<HomebrewItemDoc>(Paths.homebrewItems(campaignId));
  },

  listenAll(campaignId: string, onChange: (items: HomebrewItemDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<HomebrewItemDoc>(Paths.homebrewItems(campaignId), onChange, onError);
  },
};

/* ── Homebrew Spells ────────────────────────────────────────── */

export const normalizedHomebrewSpells = {
  async push(campaignId: string, spell: HomebrewSpellDoc): Promise<boolean> {
    return writeDoc(Paths.homebrewSpell(campaignId, spell.id), {
      data: safeStringify(spell),
    });
  },

  async remove(campaignId: string, spellId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.homebrewSpell(campaignId, spellId));
  },

  async fetchAll(campaignId: string): Promise<HomebrewSpellDoc[]> {
    return readAllDocs<HomebrewSpellDoc>(Paths.homebrewSpells(campaignId));
  },

  listenAll(campaignId: string, onChange: (spells: HomebrewSpellDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<HomebrewSpellDoc>(Paths.homebrewSpells(campaignId), onChange, onError);
  },
};

/* ── Homebrew Feats ─────────────────────────────────────────── */

export const normalizedHomebrewFeats = {
  async push(campaignId: string, feat: HomebrewFeatDoc): Promise<boolean> {
    return writeDoc(Paths.homebrewFeat(campaignId, feat.id), {
      data: safeStringify(feat),
    });
  },

  async remove(campaignId: string, featId: string): Promise<boolean> {
    return deleteDocAtPath(Paths.homebrewFeat(campaignId, featId));
  },

  async fetchAll(campaignId: string): Promise<HomebrewFeatDoc[]> {
    return readAllDocs<HomebrewFeatDoc>(Paths.homebrewFeats(campaignId));
  },

  listenAll(campaignId: string, onChange: (feats: HomebrewFeatDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    return listenCollection<HomebrewFeatDoc>(Paths.homebrewFeats(campaignId), onChange, onError);
  },
};

/* ── Normalized Sync Manager ────────────────────────────────── */

interface SyncManagerCallbacks {
  onCharacters?: (chars: CharacterDoc[]) => void;
  onEnemies?: (enemies: EnemyDoc[]) => void;
  onEncounters?: (encs: EncounterDoc[]) => void;
  onMaps?: (maps: MapDoc[]) => void;
  onJournal?: (entries: JournalEntryDoc[]) => void;
  onSessions?: (sessions: SessionDoc[]) => void;
  onCombatLog?: (entries: CombatLogEntryDoc[]) => void;
  onItems?: (items: HomebrewItemDoc[]) => void;
  onSpells?: (spells: HomebrewSpellDoc[]) => void;
  onFeats?: (feats: HomebrewFeatDoc[]) => void;
}

export const normalizedSync = {
  privateUnsubscribers: new Map<string, Unsubscribe>(),
  privateIsListening: false,

  isListening(): boolean {
    return this.privateIsListening;
  },

  /**
   * Start listening to all subcollections for a campaign.
   * Callbacks hydrate Zustand stores.
   *
   * NOTE: Homebrew listeners (items/spells/feats) are global and
   * do NOT take a campaignId — they're registered separately.
   */
  start(
    campaignId: string,
    callbacks?: SyncManagerCallbacks,
  ): void {
    this.stop(campaignId);

    const register = (key: string, unsub: Unsubscribe | null) => {
      if (unsub) this.privateUnsubscribers.set(`${campaignId}_${key}`, unsub);
    };

    // Campaign meta
    const metaUnsub = normalizedCampaign.listenMeta(campaignId, () => {
      // Handled separately by campaign store via direct listener
    });
    register("meta", metaUnsub);

    // Characters
    if (callbacks?.onCharacters) {
      register("characters", normalizedCharacters.listenAll(campaignId, callbacks.onCharacters));
    }

    // Enemies
    if (callbacks?.onEnemies) {
      register("enemies", normalizedEnemies.listenAll(campaignId, callbacks.onEnemies));
    }

    // Encounters
    if (callbacks?.onEncounters) {
      register("encounters", normalizedEncounters.listenAll(campaignId, callbacks.onEncounters));
    }

    // Maps (without tokens — tokens are listened per-map)
    if (callbacks?.onMaps) {
      register("maps", normalizedMaps.listenAll(campaignId, callbacks.onMaps));
    }

    // Journal
    if (callbacks?.onJournal) {
      register("journal", normalizedJournal.listenAll(campaignId, callbacks.onJournal));
    }

    // Sessions
    if (callbacks?.onSessions) {
      register("sessions", normalizedSessions.listenAll(campaignId, callbacks.onSessions));
    }

    // Combat Log
    if (callbacks?.onCombatLog) {
      register("combatLog", normalizedCombatLog.listenAll(campaignId, callbacks.onCombatLog));
    }

    // Homebrew (per-campaign subcollections)
    if (callbacks?.onItems) {
      register("items", normalizedHomebrewItems.listenAll(campaignId, callbacks.onItems));
    }
    if (callbacks?.onSpells) {
      register("spells", normalizedHomebrewSpells.listenAll(campaignId, callbacks.onSpells));
    }
    if (callbacks?.onFeats) {
      register("feats", normalizedHomebrewFeats.listenAll(campaignId, callbacks.onFeats));
    }

    this.privateIsListening = true;
    console.log(`[NormalizedSync] Started listening for campaign ${campaignId}`);
  },

  /**
   * Convenience: listen for tokens on a specific map.
   * Returns the unsubscribe function directly.
   */
  listenTokens(
    campaignId: string,
    mapId: string,
    onChange: (tokens: MapTokenDoc[]) => void,
    onError?: (err: string) => void,
  ): Unsubscribe | null {
    const key = `${campaignId}_tokens_${mapId}`;
    const existing = this.privateUnsubscribers.get(key);
    if (existing) existing();

    const unsub = normalizedTokens.listenAll(campaignId, mapId, onChange, onError);
    if (unsub) {
      this.privateUnsubscribers.set(key, unsub);
    }
    return unsub;
  },

  /** Stop listening to tokens for a specific map. */
  unlistenTokens(campaignId: string, mapId: string): void {
    const key = `${campaignId}_tokens_${mapId}`;
    const existing = this.privateUnsubscribers.get(key);
    if (existing) {
      existing();
      this.privateUnsubscribers.delete(key);
    }
  },

  /**
   * Stop all listeners for a campaign.
   */
  stop(campaignId?: string): void {
    if (campaignId) {
      for (const [key, unsub] of this.privateUnsubscribers) {
        if (key.startsWith(campaignId)) {
          unsub();
          this.privateUnsubscribers.delete(key);
        }
      }
    } else {
      this.stopAll();
    }
    this.privateIsListening = this.privateUnsubscribers.size > 0;
  },

  /** Stop all listeners. */
  stopAll(): void {
    for (const unsub of this.privateUnsubscribers.values()) {
      unsub();
    }
    this.privateUnsubscribers.clear();
    this.privateIsListening = false;
  },

  /** Push all subcollections for full sync. */
  async pushAll(campaignId: string, campaignMeta: CampaignMeta, characters: CharacterDoc[], enemies: EnemyDoc[], encounters: EncounterDoc[], maps: MapDoc[], journals: JournalEntryDoc[]): Promise<boolean> {
    let allOk = true;

    const metaOk = await normalizedCampaign.pushMeta(campaignId, campaignMeta);
    if (!metaOk) allOk = false;

    for (const char of characters) {
      const ok = await normalizedCharacters.push(campaignId, char);
      if (!ok) allOk = false;
    }

    for (const enemy of enemies) {
      const ok = await normalizedEnemies.push(campaignId, enemy);
      if (!ok) allOk = false;
    }

    for (const enc of encounters) {
      const ok = await normalizedEncounters.push(campaignId, enc);
      if (!ok) allOk = false;
    }

    for (const map of maps) {
      const ok = await normalizedMaps.push(campaignId, map);
      if (!ok) allOk = false;
    }

    for (const entry of journals) {
      const ok = await normalizedJournal.push(campaignId, entry);
      if (!ok) allOk = false;
    }

    return allOk;
  },
};
