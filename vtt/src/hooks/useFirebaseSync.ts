/* ── Firebase Sync Hook (Normalized) ───────────────────────────
 *
 * Manages the Firebase real-time sync lifecycle using the NORMALIZED
 * subcollection-based Firestore layout.
 *
 * Call ONCE at the root of all DM routes (done in AppShell.tsx).
 *
 * UPGRADED FEATURES:
 * • Persistent sync queue (localStorage) — pending writes survive page reload
 * • Exponential backoff retry for failed pushes
 * • Queue flush on reconnect
 * • Debounced push per domain (campaign 2s, combat 1.5s, homebrew 2s)
 * • Subcollection-aware writes — each entity type pushes to its own path
 *
 * ── Data Flow ───────────────────────────────────────────────
 *   onSnapshot listeners hydrate Zustand stores directly.
 *   State mutations in components → debounced push → individual Firestore doc.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { normalizedSync, normalizedCampaign, normalizedCharacters, normalizedEnemies, normalizedEncounters, normalizedMaps, normalizedTokens, normalizedJournal, normalizedHomebrewItems, normalizedHomebrewSpells, normalizedHomebrewFeats, normalizedSessions } from "@/lib/normalized-firebase-service";
import type { CampaignMeta, CharacterDoc, EnemyDoc, MapTokenDoc, JournalEntryDoc, HomebrewItemDoc, HomebrewSpellDoc, HomebrewFeatDoc, SessionDoc } from "@/types/firestore";
import type { PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings } from "@/types";
import type { HomebrewItem, HomebrewFeat, HomebrewSpell } from "@/types/homebrew";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";

const CAMPAIGN_ID = "arkla";

/* ── Persistent Sync Queue ──────────────────────────────────── */

interface QueuedPush {
  id: string;
  domain: "campaign" | "session" | "homebrew" | "character" | "enemy" | "encounter" | "map" | "token" | "journal" | "item" | "spell" | "feat";
  entityId?: string;
  subId?: string;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "vtt-sync-queue-normalized";
const MAX_RETRIES = 5;

function loadQueue(): QueuedPush[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(queue: QueuedPush[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function enqueuePush(domain: QueuedPush["domain"], entityId?: string, subId?: string): string {
  const queue = loadQueue();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, domain, entityId, subId, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
  return id;
}

function dequeuePush(id: string) {
  const queue = loadQueue().filter((q) => q.id !== id);
  saveQueue(queue);
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

/**
 * Flushes all queued pushes that haven't exceeded max retries.
 * Called on reconnection and on mount.
 */
async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  const staleIds: string[] = [];

  for (const entry of queue) {
    if (entry.retries >= MAX_RETRIES) {
      staleIds.push(entry.id);
      continue;
    }

    try {
      let ok = false;
      const campaignId = CAMPAIGN_ID;

      switch (entry.domain) {
        case "campaign": {
          const meta = useCampaignStore.getState().meta;
          if (meta) ok = await normalizedCampaign.pushMeta(campaignId, meta);
          break;
        }
        case "character": {
          if (entry.entityId) {
            const char = useCampaignStore.getState().characters.find((c) => c.id === entry.entityId);
            if (char) ok = await normalizedCharacters.push(campaignId, char as unknown as CharacterDoc);
          }
          break;
        }
        case "enemy": {
          if (entry.entityId) {
            const enemy = useCampaignStore.getState().enemies.find((e) => e.id === entry.entityId);
            if (enemy) ok = await normalizedEnemies.push(campaignId, enemy);
          }
          break;
        }
        case "encounter": {
          if (entry.entityId) {
            const enc = useCampaignStore.getState().encounters.find((e) => e.id === entry.entityId);
            if (enc) ok = await normalizedEncounters.push(campaignId, enc as unknown as EncounterDoc);
          }
          break;
        }
        case "map": {
          if (entry.entityId) {
            const map = useCampaignStore.getState().battleMaps.find((m) => m.id === entry.entityId);
            if (map) ok = await normalizedMaps.push(campaignId, map);
          }
          break;
        }
        case "token": {
          if (entry.entityId && entry.subId) {
            const token = (useCampaignStore.getState().mapTokens[entry.entityId] ?? []).find((t) => t.id === entry.subId);
            if (token) ok = await normalizedTokens.push(campaignId, entry.entityId, token);
          }
          break;
        }
        case "journal": {
          if (entry.entityId) {
            const journal = useCampaignStore.getState().journal.find((j) => j.id === entry.entityId);
            if (journal) ok = await normalizedJournal.push(campaignId, journal as unknown as JournalEntryDoc);
          }
          break;
        }
        case "session": {
          const sessionState = useCombatStore.getState().liveSession;
          if (sessionState) {
            const session: SessionDoc = {
              id: "current",
              name: `Session ${new Date().toLocaleDateString()}`,
              phase: sessionState.phase,
              startedAt: sessionState.sessionStartedAt,
              endedAt: null,
              currentScene: sessionState.currentScene,
              currentMapUrl: sessionState.currentMapUrl,
              dmAnnouncement: sessionState.dmAnnouncement,
              conditions: sessionState.conditions,
              activeEncounterId: activeEncounter?.id ?? null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            ok = await normalizedSessions.push(campaignId, session);
          }
          break;
        }
        case "item": {
          if (entry.entityId) {
            const item = useHomebrewStore.getState().items.find((i) => i.id === entry.entityId);
            if (item) ok = await normalizedHomebrewItems.push(item as unknown as HomebrewItemDoc);
          }
          break;
        }
        case "spell": {
          if (entry.entityId) {
            const spell = useHomebrewStore.getState().spells.find((s) => s.id === entry.entityId);
            if (spell) ok = await normalizedHomebrewSpells.push(spell as unknown as HomebrewSpellDoc);
          }
          break;
        }
        case "feat": {
          if (entry.entityId) {
            const feat = useHomebrewStore.getState().feats.find((f) => f.id === entry.entityId);
            if (feat) ok = await normalizedHomebrewFeats.push(feat as unknown as HomebrewFeatDoc);
          }
          break;
        }
        default: {
          ok = await pushAllDomains();
        }
      }

      if (ok) {
        dequeuePush(entry.id);
      } else {
        incrementRetry(entry.id);
      }
    } catch {
      incrementRetry(entry.id);
    }
  }

  for (const id of staleIds) {
    dequeuePush(id);
  }
}

/* ── Push All Domains ───────────────────────────────────────── */

async function pushAllDomains(): Promise<boolean> {
  const campaignId = CAMPAIGN_ID;
  let allOk = true;

  const meta = useCampaignStore.getState().meta;
  if (meta) {
    const ok = await normalizedCampaign.pushMeta(campaignId, meta);
    if (!ok) allOk = false;
  }

  const { characters, enemies, encounters, battleMaps, journal } = useCampaignStore.getState();

  for (const char of characters) {
    const ok = await normalizedCharacters.push(campaignId, char as unknown as CharacterDoc);
    if (!ok) allOk = false;
  }

  for (const enemy of enemies) {
    const ok = await normalizedEnemies.push(campaignId, enemy);
    if (!ok) allOk = false;
  }

  for (const enc of encounters) {
    const ok = await normalizedEncounters.push(campaignId, enc as unknown as EncounterDoc);
    if (!ok) allOk = false;
  }

  for (const map of battleMaps) {
    const ok = await normalizedMaps.push(campaignId, map);
    if (!ok) allOk = false;
  }

  for (const entry of journal) {
    const ok = await normalizedJournal.push(campaignId, entry as unknown as JournalEntryDoc);
    if (!ok) allOk = false;
  }

  const { items, spells, feats } = useHomebrewStore.getState();
  for (const item of items) {
    const ok = await normalizedHomebrewItems.push(item as unknown as HomebrewItemDoc);
    if (!ok) allOk = false;
  }
  for (const spell of spells) {
    const ok = await normalizedHomebrewSpells.push(spell as unknown as HomebrewSpellDoc);
    if (!ok) allOk = false;
  }
  for (const feat of feats) {
    const ok = await normalizedHomebrewFeats.push(feat as unknown as HomebrewFeatDoc);
    if (!ok) allOk = false;
  }

  return allOk;
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useFirebaseSync(): void {
  const initialized = useRef(false);
  const queueFlushed = useRef(false);
  const authState = useAuthStore((s) => s.state);
  const authRole = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  const meta = useCampaignStore((s) => s.meta);
  const metaUpdatedAt = meta?.updatedAt ?? 0;

  // ── Combat watchers ──
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);

  // ── Homebrew watchers ──
  const homebrewItemsLen = useHomebrewStore((s) => s.items.length);
  const homebrewFeatsLen = useHomebrewStore((s) => s.feats.length);
  const homebrewSpellsLen = useHomebrewStore((s) => s.spells.length);

  // ── Force push counter ──
  const forcePushCounter = useCampaignStore((s) => s.forcePushCounter);

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedPush = useCallback((domain: QueuedPush["domain"], fn: () => Promise<boolean>, delay: number, entityId?: string, subId?: string) => {
    const qId = enqueuePush(domain, entityId, subId);
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const ok = await fn();
        if (ok) {
          dequeuePush(qId);
        } else {
          incrementRetry(qId);
        }
      } catch {
        incrementRetry(qId);
      }
    }, delay);
  }, []);

  /* ── Flush pending queue on reconnect ── */
  useEffect(() => {
    if (firebaseConnected && queueFlushed.current) {
      flushQueue();
    }
  }, [firebaseConnected]);

  /* ── Start/Stop Listeners on Auth Change ── */
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    if (authState === "authenticated" && authRole === "dm") {
      // Start the normalized sync manager with callbacks that hydrate the stores
      const unsubCharacters = normalizedCharacters.listenAll(CAMPAIGN_ID, (chars) => {
        useCampaignStore.getState().setCampaign({
          ...useCampaignStore.getState().campaign!,
          playerCharacters: chars as unknown as PlayerCharacter[],
        });
      });

      const unsubEnemies = normalizedEnemies.listenAll(CAMPAIGN_ID, (enemies) => {
        const state = useCampaignStore.getState();
        (state as { enemies: EnemyDoc[] }).enemies = enemies;
      });

      const unsubMaps = normalizedMaps.listenAll(CAMPAIGN_ID, (maps) => {
        const state = useCampaignStore.getState();
        (state as { battleMaps: BattleMap[] }).battleMaps = maps as unknown as BattleMap[];
      });

      const unsubJournal = normalizedJournal.listenAll(CAMPAIGN_ID, (entries) => {
        const state = useCampaignStore.getState();
        (state as { journal: JournalEntry[] }).journal = entries as unknown as JournalEntry[];
      });

      const unsubItems = normalizedHomebrewItems.listenAll((items) => {
        useHomebrewStore.getState().setItems(items as unknown as HomebrewItem[]);
      });

      const unsubSpells = normalizedHomebrewSpells.listenAll((spells) => {
        useHomebrewStore.getState().setSpells(spells as unknown as HomebrewSpell[]);
      });

      const unsubFeats = normalizedHomebrewFeats.listenAll((feats) => {
        useHomebrewStore.getState().setFeats(feats as unknown as HomebrewFeat[]);
      });

      // Store unsubscribers for cleanup
      const unsubs = [unsubCharacters, unsubEnemies, unsubMaps, unsubJournal, unsubItems, unsubSpells, unsubFeats].filter(Boolean) as (() => void)[];

      initialized.current = true;

      // Flush any pending offline writes on mount
      if (!queueFlushed.current) {
        queueFlushed.current = true;
        flushQueue();
      }

      pushAllDomains().catch(() => {});

      return () => {
        unsubs.forEach((u) => u());
      };
    }
  }, [authState, authRole]);

  /* ── Push Campaign Meta & Entities ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    if (!meta) return;

    debouncedPush("campaign", async () => {
      return normalizedCampaign.pushMeta(CAMPAIGN_ID, meta);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaUpdatedAt, forcePushCounter, authState, authRole]);

  /* ── Push Combat/Session ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("session", async () => {
      const sessionState = useCombatStore.getState().liveSession;
      const currentEncounter = useCombatStore.getState().activeEncounter;
      const session: SessionDoc = {
        id: "current",
        name: `Session ${new Date().toLocaleDateString()}`,
        phase: sessionState.phase,
        startedAt: sessionState.sessionStartedAt,
        endedAt: null,
        currentScene: sessionState.currentScene,
        currentMapUrl: sessionState.currentMapUrl,
        dmAnnouncement: sessionState.dmAnnouncement,
        conditions: sessionState.conditions,
        activeEncounterId: currentEncounter?.id ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return normalizedSessions.push(CAMPAIGN_ID, session);
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeEncounter?.phase, activeEncounter?.round,
    activeEncounter?.currentCombatantIndex, activeEncounter?.combatants.length,
    activeEncounter?.startedAt, activeEncounter?.completedAt,
    liveSession.phase, liveSession.currentScene, liveSession.currentMapUrl,
    liveSession.dmAnnouncement, liveSession.sessionStartedAt,
    authState, authRole,
  ]);

  /* ── Push Homebrew ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("homebrew", async () => {
      const { items, spells, feats } = useHomebrewStore.getState();
      let allOk = true;
      for (const item of items) {
        const ok = await normalizedHomebrewItems.push(item as unknown as HomebrewItemDoc);
        if (!ok) allOk = false;
      }
      for (const spell of spells) {
        const ok = await normalizedHomebrewSpells.push(spell as unknown as HomebrewSpellDoc);
        if (!ok) allOk = false;
      }
      for (const feat of feats) {
        const ok = await normalizedHomebrewFeats.push(feat as unknown as HomebrewFeatDoc);
        if (!ok) allOk = false;
      }
      return allOk;
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homebrewItemsLen, homebrewFeatsLen, homebrewSpellsLen, authState, authRole]);

  /* ── Welcome Toast ── */
  useEffect(() => {
    if (!initialized.current) return;
    initialized.current = false;
    if (isFirebaseAvailable() && authState === "authenticated") {
      showToast({
        message: "Cloud sync is active. Offline queue ready.",
        type: "info",
        duration: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Triggers an immediate full sync push to Firestore.
 * Flushes the pending queue first, then pushes all domains.
 */
export async function triggerFullSync(): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  await flushQueue();
  return pushAllDomains();
}

/**
 * Returns the count of pending (unsynced) items in the queue.
 * Use this to show a "pending sync" badge in the UI.
 */
export function getPendingSyncCount(): number {
  return loadQueue().length;
}
