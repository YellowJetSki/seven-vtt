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
 * • Session Combatants sync — live combatant state pushed to /sessions/{id}/combatants/
 * • Combat Log sync — full combat log pushed to /combatLog/
 *
 * ── Data Flow ───────────────────────────────────────────────
 *   onSnapshot listeners hydrate Zustand stores via set().
 *   State mutations in components → debounced push → individual Firestore doc.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { normalizedSync, normalizedCampaign, normalizedCharacters, normalizedEnemies, normalizedEncounters, normalizedMaps, normalizedTokens, normalizedJournal, normalizedHomebrewItems, normalizedHomebrewSpells, normalizedHomebrewFeats, normalizedSessions, normalizedSessionCombatants, normalizedCombatLog } from "@/lib/normalized-firebase-service";
import type { CampaignMeta, CharacterDoc, EnemyDoc, EncounterDoc, MapTokenDoc, JournalEntryDoc, HomebrewItemDoc, HomebrewSpellDoc, HomebrewFeatDoc, SessionDoc, SessionCombatantDoc, CombatLogEntryDoc } from "@/types/firestore";
import type { PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings } from "@/types";
import type { HomebrewItem, HomebrewFeat, HomebrewSpell } from "@/types/homebrew";
import type { Combatant, CombatLogEntry } from "@/types/combat";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";

const CAMPAIGN_ID = "arkla";

/* ── Persistent Sync Queue ──────────────────────────────────── */

interface QueuedPush {
  id: string;
  domain: "campaign" | "session" | "homebrew" | "character" | "enemy" | "encounter" | "map" | "token" | "journal" | "item" | "spell" | "feat" | "combatant" | "combatlog";
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
            const activeEncounter = useCombatStore.getState().activeEncounter;
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
        case "combatant": {
          if (entry.entityId) {
            const combatant = (useCombatStore.getState().activeEncounter?.combatants ?? []).find((c) => c.id === entry.entityId);
            if (combatant) {
              ok = await normalizedSessionCombatants.push(campaignId, "current", combatant as unknown as SessionCombatantDoc);
            }
          }
          break;
        }
        case "combatlog": {
          if (entry.entityId) {
            const logEntry = useCombatStore.getState().combatLog.find((l) => l.id === entry.entityId);
            if (logEntry) {
              ok = await normalizedCombatLog.push(campaignId, logEntry as unknown as CombatLogEntryDoc);
            }
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

  // ── Session Combatants ──
  const activeEncounter = useCombatStore.getState().activeEncounter;
  if (activeEncounter) {
    for (const combatant of activeEncounter.combatants) {
      const ok = await normalizedSessionCombatants.push(campaignId, "current", combatant as unknown as SessionCombatantDoc);
      if (!ok) allOk = false;
    }
  }

  // ── Combat Log ──
  const combatLog = useCombatStore.getState().combatLog;
  for (const entry of combatLog) {
    const ok = await normalizedCombatLog.push(campaignId, entry as unknown as CombatLogEntryDoc);
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
  const combatLogLen = useCombatStore((s) => s.combatLog.length);
  const combatantsVersion = activeEncounter?.combatants.length ?? 0;

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
      // Register Firestore listeners that hydrate Zustand stores via set().
      // All mutations go through proper Zustand set() to ensure
      // React re-renders, persist middleware serialization, and campaign recomputation.

      // ── Characters ──
      const unsubCharacters = normalizedCharacters.listenAll(CAMPAIGN_ID, (chars) => {
        const store = useCampaignStore.getState();
        if (!store.meta) return; // No campaign yet — ignore remote data
        const storeCharIds = new Set(store.characters.map((c) => c.id));
        const incomingIds = new Set(chars.map((c) => c.id));
        // Only update if there are actual remote changes not in local store
        const hasNewData = chars.some((c) => !storeCharIds.has(c.id));
        if (hasNewData) {
          store.setCampaign({
            ...store.campaign!,
            playerCharacters: chars as unknown as PlayerCharacter[],
          });
        }
      });

      // ── Enemies ──
      const unsubEnemies = normalizedEnemies.listenAll(CAMPAIGN_ID, (enemies) => {
        const store = useCampaignStore.getState();
        if (!store.meta) return;
        const storeEnemyIds = new Set(store.enemies.map((e) => e.id));
        const hasNewData = enemies.some((e) => !storeEnemyIds.has(e.id));
        if (hasNewData) {
          store.setCampaign({
            ...store.campaign!,
            encounters: store.encounters,
            battleMaps: store.battleMaps,
            journal: store.journal,
            playerCharacters: store.characters,
          });
        }
      });

      // ── Maps ──
      const unsubMaps = normalizedMaps.listenAll(CAMPAIGN_ID, (maps) => {
        const store = useCampaignStore.getState();
        if (!store.meta) return;
        const storeMapIds = new Set(store.battleMaps.map((m) => m.id));
        const hasNewData = maps.some((m) => !storeMapIds.has(m.id));
        if (hasNewData) {
          store.setCampaign({
            ...store.campaign!,
            battleMaps: maps as unknown as BattleMap[],
            playerCharacters: store.characters,
            encounters: store.encounters,
            journal: store.journal,
          });
        }
      });

      // ── Journal ──
      const unsubJournal = normalizedJournal.listenAll(CAMPAIGN_ID, (entries) => {
        const store = useCampaignStore.getState();
        if (!store.meta) return;
        const storeJournalIds = new Set(store.journal.map((j) => j.id));
        const hasNewData = entries.some((e) => !storeJournalIds.has(e.id));
        if (hasNewData) {
          store.setCampaign({
            ...store.campaign!,
            journal: entries as unknown as JournalEntry[],
            playerCharacters: store.characters,
            encounters: store.encounters,
            battleMaps: store.battleMaps,
          });
        }
      });

      // ── Session Combatants ──
      const unsubSessionCombatants = normalizedSessionCombatants.listenAll(CAMPAIGN_ID, "current", (combatants) => {
        const store = useCombatStore.getState();
        const activeEnc = store.activeEncounter;
        if (!activeEnc) return;
        // Only update if remote data has different combatants than local
        const localIds = new Set(activeEnc.combatants.map((c) => c.id));
        const hasNewData = combatants.some((c) => !localIds.has(c.id));
        if (hasNewData) {
          // Merge incoming combatant data into the active encounter
          const mergedCombatants = activeEnc.combatants.map((local) => {
            const remote = combatants.find((r) => r.id === local.id);
            // Preserve local initiative & turn data, update HP and status from remote
            return remote ? {
              ...local,
              hitPoints: remote.hitPoints,
              statusEffects: remote.statusEffects.map((s) => ({ id: s.id, effect: s.effect })),
              isDead: remote.isDead,
              isConcentrating: remote.isConcentrating,
              notes: remote.notes,
              imageUrl: remote.imageUrl,
            } : local;
          });
          // Keep any combatants that exist in remote but not locally (e.g. added by another DM device)
          const remoteIds = new Set(combatants.map((c) => c.id));
          for (const remote of combatants) {
            if (!localIds.has(remote.id)) {
              mergedCombatants.push(remote as unknown as Combatant);
            }
          }
          store.setActiveEncounter(activeEnc.id);
        }
      });

      // ── Combat Log ──
      const unsubCombatLog = normalizedCombatLog.listenAll(CAMPAIGN_ID, (entries) => {
        const store = useCombatStore.getState();
        const localLen = store.combatLog.length;
        if (entries.length > localLen) {
          // New remote entries exist — merge them in
          const localIds = new Set(store.combatLog.map((e) => e.id));
          const newEntries = entries.filter((e) => !localIds.has(e.id));
          if (newEntries.length > 0) {
            // Append remote entries to local log
            const merged = [...store.combatLog, ...newEntries as unknown as CombatLogEntry[]];
            // No direct setter for combatLog — use the store's internal state
            useCombatStore.setState({ combatLog: merged });
          }
        }
      });

      // ── Homebrew Items ──
      const unsubItems = normalizedHomebrewItems.listenAll((items) => {
        const store = useHomebrewStore.getState();
        if (typeof store.setItems === "function") {
          store.setItems(items as unknown as HomebrewItem[]);
        }
      });

      // ── Homebrew Spells ──
      const unsubSpells = normalizedHomebrewSpells.listenAll((spells) => {
        const store = useHomebrewStore.getState();
        if (typeof store.setSpells === "function") {
          store.setSpells(spells as unknown as HomebrewSpell[]);
        }
      });

      // ── Homebrew Feats ──
      const unsubFeats = normalizedHomebrewFeats.listenAll((feats) => {
        const store = useHomebrewStore.getState();
        if (typeof store.setFeats === "function") {
          store.setFeats(feats as unknown as HomebrewFeat[]);
        }
      });

      // Store unsubscribers for cleanup
      const unsubs = [
        unsubCharacters, unsubEnemies, unsubMaps, unsubJournal,
        unsubSessionCombatants, unsubCombatLog,
        unsubItems, unsubSpells, unsubFeats,
      ].filter(Boolean) as (() => void)[];

      initialized.current = true;

      // Flush any pending offline writes on mount
      if (!queueFlushed.current) {
        queueFlushed.current = true;
        flushQueue();
      }

      // Initial full sync push to Firebase
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

  /* ── Push Session Combatants ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    if (!activeEncounter) return;

    for (const combatant of activeEncounter.combatants) {
      debouncedPush("combatant", async () => {
        return normalizedSessionCombatants.push(CAMPAIGN_ID, "current", combatant as unknown as SessionCombatantDoc);
      }, 1500, combatant.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    combatantsVersion,
    activeEncounter?.combatants.map((c) => `${c.id}:${c.hitPoints.current}:${c.hitPoints.temporary}:${c.isDead}:${c.statusEffects.length}`).join(","),
    authState, authRole,
  ]);

  /* ── Push Combat Log ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    const log = useCombatStore.getState().combatLog;
    if (log.length === 0) return;

    const latestEntry = log[log.length - 1];
    debouncedPush("combatlog", async () => {
      return normalizedCombatLog.push(CAMPAIGN_ID, latestEntry as unknown as CombatLogEntryDoc);
    }, 1500, latestEntry.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatLogLen, authState, authRole]);

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
