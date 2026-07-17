/* ── Firebase Sync Hook (Normalized) ───────────────────────────
 *
 * Manages Firestore subcollection listeners and debounced pushes.
 * Call ONCE at the root of all DM routes (AppShell.tsx).
 *
 * Architecture:
 *   - Listener setup/teardown via onSnapshot (in useEffect with auth deps)
 *   - Debounced push per domain (campaign 2s, combat 1.5s, homebrew 2s)
 *   - Persistent sync queue in localStorage (via sync-queue.ts)
 *   - Flush queue on reconnect
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";
import { flushQueue, enqueuePush } from "@/lib/sync-queue";
import {
  normalizedCampaign, normalizedCharacters, normalizedEnemies,
  normalizedMaps, normalizedJournal,
  normalizedSessions, normalizedSessionCombatants, normalizedCombatLog,
  normalizedHomebrewItems, normalizedHomebrewSpells, normalizedHomebrewFeats,
} from "@/lib/normalized-firebase-service";
import type { CampaignMeta, CharacterDoc, EnemyDoc, EncounterDoc, MapDoc, MapTokenDoc, JournalEntryDoc, SessionDoc, SessionCombatantDoc, CombatLogEntryDoc, HomebrewItemDoc, HomebrewSpellDoc, HomebrewFeatDoc } from "@/types/firestore";
import type { PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings } from "@/types";
import type { HomebrewItem, HomebrewFeat, HomebrewSpell } from "@/types/homebrew";
import type { Combatant, CombatLogEntry } from "@/types/combat";

const CAMPAIGN_ID = "arkla";

/* ── Push All Domains ───────────────────────────────────────── */

async function pushAllDomains(): Promise<boolean> {
  const cid = CAMPAIGN_ID;
  let allOk = true;
  const { meta, characters, enemies, encounters, battleMaps, journal } = useCampaignStore.getState();

  if (meta && !(await normalizedCampaign.pushMeta(cid, meta))) allOk = false;
  for (const c of characters) if (!(await normalizedCharacters.push(cid, c as unknown as CharacterDoc))) allOk = false;
  for (const e of enemies) if (!(await normalizedEnemies.push(cid, e))) allOk = false;
  for (const e of encounters) if (!(await normalizedEncounters.push(cid, e as unknown as EncounterDoc))) allOk = false;
  for (const m of battleMaps) if (!(await normalizedMaps.push(cid, m))) allOk = false;
  for (const j of journal) if (!(await normalizedJournal.push(cid, j as unknown as JournalEntryDoc))) allOk = false;

  const activeEnc = useCombatStore.getState().activeEncounter;
  if (activeEnc) {
    for (const combatant of activeEnc.combatants) {
      if (!(await normalizedSessionCombatants.push(cid, "current", combatant as unknown as SessionCombatantDoc))) allOk = false;
    }
  }
  for (const entry of useCombatStore.getState().combatLog) {
    if (!(await normalizedCombatLog.push(cid, entry as unknown as CombatLogEntryDoc))) allOk = false;
  }

  const { items, spells, feats } = useHomebrewStore.getState();
  for (const i of items) if (!(await normalizedHomebrewItems.push(CAMPAIGN_ID, i as unknown as HomebrewItemDoc))) allOk = false;
  for (const s of spells) if (!(await normalizedHomebrewSpells.push(CAMPAIGN_ID, s as unknown as HomebrewSpellDoc))) allOk = false;
  for (const f of feats) if (!(await normalizedHomebrewFeats.push(CAMPAIGN_ID, f as unknown as HomebrewFeatDoc))) allOk = false;

  return allOk;
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useFirebaseSync(): void {
  const initialized = useRef(false);
  const queueFlushed = useRef(false);
  const authState = useAuthStore((s) => s.state);
  const authRole = useAuthStore((s) => s.role);
  const showToast = useUiStore((s) => s.showToast);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  const meta = useCampaignStore((s) => s.meta);
  const metaUpdatedAt = meta?.updatedAt ?? 0;
  const charactersLen = useCampaignStore((s) => s.characters.length);
  const enemiesLen = useCampaignStore((s) => s.enemies.length);
  const encountersLen = useCampaignStore((s) => s.encounters.length);
  const mapsLen = useCampaignStore((s) => s.battleMaps.length);
  const journalLen = useCampaignStore((s) => s.journal.length);
  const forcePushCounter = useCampaignStore((s) => s.forcePushCounter);

  const encounterPhase = useCombatStore((s) => s.activeEncounter?.phase ?? null);
  const encounterRound = useCombatStore((s) => s.activeEncounter?.round ?? 0);
  const encounterIndex = useCombatStore((s) => s.activeEncounter?.currentCombatantIndex ?? 0);
  const combatantsLen = useCombatStore((s) => s.activeEncounter?.combatants.length ?? 0);
  const combatLogLen = useCombatStore((s) => s.combatLog?.length ?? 0);

  const homebrewItemsLen = useHomebrewStore((s) => s.items.length);
  const homebrewFeatsLen = useHomebrewStore((s) => s.feats.length);
  const homebrewSpellsLen = useHomebrewStore((s) => s.spells.length);

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedPush = useCallback((domain: "campaign" | "session" | "homebrew" | "character" | "enemy" | "encounter" | "map" | "token" | "journal" | "item" | "spell" | "feat" | "combatant" | "combatlog", fn: () => Promise<boolean>, delay: number, entityId?: string) => {
    enqueuePush(domain, entityId);
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try { await fn(); } catch { /* retried by sync-queue */ }
    }, delay);
  }, []);

  /* ── Flush on reconnect ── */
  useEffect(() => {
    if (firebaseConnected && queueFlushed.current) flushQueue();
  }, [firebaseConnected]);

  /* ── Listener setup ── */
  useEffect(() => {
    if (!isFirebaseAvailable() || authState !== "authenticated" || authRole !== "dm") return;

    const unsubCharacters = normalizedCharacters.listenAll(CAMPAIGN_ID, (chars) => {
      const store = useCampaignStore.getState();
      if (!store.meta) return;
      const storeIds = new Set(store.characters.map((c) => c.id));
      const hasNew = chars.some((c) => !storeIds.has(c.id));
      if (hasNew && store.campaign)
        store.setCampaign({ ...store.campaign, playerCharacters: chars as unknown as PlayerCharacter[] });
    });

    const unsubMaps = normalizedMaps.listenAll(CAMPAIGN_ID, (maps) => {
      const store = useCampaignStore.getState();
      if (!store.meta) return;
      const storeIds = new Set(store.battleMaps.map((m) => m.id));
      const hasNew = maps.some((m) => !storeIds.has(m.id));
      if (hasNew && store.campaign)
        store.setCampaign({ ...store.campaign, battleMaps: maps as unknown as BattleMap[], playerCharacters: store.characters, encounters: store.encounters, journal: store.journal });
    });

    const unsubJournal = normalizedJournal.listenAll(CAMPAIGN_ID, (entries) => {
      const store = useCampaignStore.getState();
      if (!store.meta) return;
      const storeIds = new Set(store.journal.map((j) => j.id));
      const hasNew = entries.some((e) => !storeIds.has(e.id));
      if (hasNew && store.campaign)
        store.setCampaign({ ...store.campaign, journal: entries as unknown as JournalEntry[], playerCharacters: store.characters, encounters: store.encounters, battleMaps: store.battleMaps });
    });

    const unsubCombatLog = normalizedCombatLog.listenAll(CAMPAIGN_ID, (entries) => {
      const store = useCombatStore.getState();
      const storeIds = new Set(store.combatLog.map((e) => e.id));
      const newEntries = entries.filter((e) => !storeIds.has(e.id));
      if (newEntries.length > 0)
        useCombatStore.setState({ combatLog: [...store.combatLog, ...newEntries as unknown as CombatLogEntry[]] });
    });

    const unsubItems = normalizedHomebrewItems.listenAll(CAMPAIGN_ID, (items) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setItems === "function") store.setItems(items as unknown as HomebrewItem[]);
    });
    const unsubSpells = normalizedHomebrewSpells.listenAll(CAMPAIGN_ID, (spells) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setSpells === "function") store.setSpells(spells as unknown as HomebrewSpell[]);
    });
    const unsubFeats = normalizedHomebrewFeats.listenAll(CAMPAIGN_ID, (feats) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setFeats === "function") store.setFeats(feats as unknown as HomebrewFeat[]);
    });

    const unsubs = [unsubCharacters, unsubMaps, unsubJournal, unsubCombatLog, unsubItems, unsubSpells, unsubFeats].filter(Boolean) as (() => void)[];

    initialized.current = true;
    if (!queueFlushed.current) { queueFlushed.current = true; flushQueue(); }
    pushAllDomains().catch(() => {});

    return () => unsubs.forEach((u) => u());
  }, [authState, authRole]);

  /* ── Push Campaign Meta ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm" || !meta) return;
    debouncedPush("campaign", () => normalizedCampaign.pushMeta(CAMPAIGN_ID, meta), 2000);
  }, [metaUpdatedAt, forcePushCounter, authState, authRole]);

  /* ── Push Session State ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("session", async () => {
      const s = useCombatStore.getState().liveSession;
      const e = useCombatStore.getState().activeEncounter;
      return normalizedSessions.push(CAMPAIGN_ID, {
        id: "current", name: `Session ${new Date().toLocaleDateString()}`,
        phase: s.phase, startedAt: s.sessionStartedAt, endedAt: null,
        currentScene: s.currentScene, currentMapUrl: s.currentMapUrl,
        dmAnnouncement: s.dmAnnouncement, conditions: s.conditions,
        activeEncounterId: e?.id ?? null, createdAt: Date.now(), updatedAt: Date.now(),
      });
    }, 1500);
  }, [encounterPhase, encounterRound, encounterIndex, combatantsLen, authState, authRole]);

  /* ── Push Combat Log ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    const log = useCombatStore.getState().combatLog;
    if (log.length === 0) return;
    const latest = log[log.length - 1];
    debouncedPush("combatlog", () => normalizedCombatLog.push(CAMPAIGN_ID, latest as unknown as CombatLogEntryDoc), 1500, latest.id);
  }, [combatLogLen, authState, authRole]);

  /* ── Push Homebrew ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("homebrew", async () => {
      const { items, spells, feats } = useHomebrewStore.getState();
      let allOk = true;
      for (const i of items) if (!(await normalizedHomebrewItems.push(CAMPAIGN_ID, i as unknown as HomebrewItemDoc))) allOk = false;
      for (const s of spells) if (!(await normalizedHomebrewSpells.push(CAMPAIGN_ID, s as unknown as HomebrewSpellDoc))) allOk = false;
      for (const f of feats) if (!(await normalizedHomebrewFeats.push(CAMPAIGN_ID, f as unknown as HomebrewFeatDoc))) allOk = false;
      return allOk;
    }, 2000);
  }, [homebrewItemsLen, homebrewFeatsLen, homebrewSpellsLen, authState, authRole]);

  /* ── Welcome Toast ── */
  useEffect(() => {
    if (!initialized.current || !isFirebaseAvailable() || authState !== "authenticated") return;
    showToast({ message: "Cloud sync is active. Offline queue ready.", type: "info", duration: 3000 });
  }, []);
}

export async function triggerFullSync(): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  await flushQueue();
  return pushAllDomains();
}

export function getPendingSyncCount(): number {
  try {
    const raw = localStorage.getItem("vtt-sync-queue-normalized");
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}
