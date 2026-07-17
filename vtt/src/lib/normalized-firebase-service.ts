/* ── Normalized Firebase Sync Service ─────────────────────────
 *
 * Writes each entity to its own SUBCOLLECTION document using a factory
 * pattern to eliminate repetitive CRUD boilerplate.
 *
 * Each subcollection stores: { data: <entity>, updatedAt, updatedBy }
 *
 * Colllection Layout:
 *   campaigns/{id}                       → CampaignMeta
 *   campaigns/{id}/characters/{cid}     → CharacterDoc
 *   campaigns/{id}/enemies/{eid}        → EnemyDoc
 *   campaigns/{id}/encounters/{eid}     → EncounterDoc
 *   campaigns/{id}/maps/{mid}           → MapDoc
 *   campaigns/{id}/maps/{mid}/tokens/{t}→ MapTokenDoc
 *   campaigns/{id}/journal/{jid}        → JournalEntryDoc
 *   campaigns/{id}/sessions/{sid}       → SessionDoc
 *   campaigns/{id}/sessions/{sid}/combatants/{c} → SessionCombatantDoc
 *   campaigns/{id}/combatLog/{lid}      → CombatLogEntryDoc
 *   homebrew/{id}/items/{iid}           → HomebrewItemDoc
 *   homebrew/{id}/spells/{spid}         → HomebrewSpellDoc
 *   homebrew/{id}/feats/{fid}           → HomebrewFeatDoc
 * ─────────────────────────────────────────────────────────────── */

import { doc, onSnapshot, type Unsubscribe, type DocumentData } from "firebase/firestore";
import { getDb, isFirebaseAvailable } from "@/lib/firebase";
import { Paths } from "@/types/firestore";
import { createDomainStub, createTokenStub, writeDoc, readDoc } from "./firestore-helpers";
import type {
  CampaignMeta, CharacterDoc, EnemyDoc, EncounterDoc, MapDoc, MapTokenDoc,
  JournalEntryDoc, SessionDoc, SessionCombatantDoc, CombatLogEntryDoc,
  HomebrewItemDoc, HomebrewSpellDoc, HomebrewFeatDoc,
} from "@/types/firestore";

/* ── Campaign Meta (single doc — special case) ──────────────── */

export const normalizedCampaign = {
  async pushMeta(campaignId: string, meta: CampaignMeta): Promise<boolean> {
    return writeDoc(Paths.campaignMeta(campaignId), { data: JSON.parse(JSON.stringify(meta)) });
  },

  async fetchMeta(campaignId: string): Promise<CampaignMeta | null> {
    return readDoc<CampaignMeta>(Paths.campaignMeta(campaignId));
  },

  listenMeta(campaignId: string, onChange: (meta: CampaignMeta | null) => void, onError?: (err: string) => void): Unsubscribe | null {
    if (!isFirebaseAvailable()) return null;
    try {
      const db = getDb()!;
      const ref = doc(db, Paths.campaignMeta(campaignId));
      return onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const raw = snapshot.data() as DocumentData;
            onChange((raw.data ?? raw) as CampaignMeta);
          } else {
            onChange(null);
          }
        },
        (error) => { console.error(`[NormalizedSync] CampaignMeta error:`, error); onError?.(error.message); },
      );
    } catch (err) {
      console.error(`[NormalizedSync] CampaignMeta listener failed:`, err);
      onError?.(String(err));
      return null;
    }
  },
};

/* ── Domain Stubs (factory-generated) ───────────────────────── */

export const normalizedCharacters = createDomainStub<CharacterDoc>(
  (cid, id) => Paths.character(cid, id),
  (cid) => Paths.characters(cid),
);

export const normalizedEnemies = createDomainStub<EnemyDoc>(
  (cid, id) => Paths.enemy(cid, id),
  (cid) => Paths.enemies(cid),
);

export const normalizedEncounters = createDomainStub<EncounterDoc>(
  (cid, id) => Paths.encounter(cid, id),
  (cid) => Paths.encounters(cid),
);

export const normalizedMaps = createDomainStub<MapDoc>(
  (cid, id) => Paths.map(cid, id),
  (cid) => Paths.maps(cid),
);

export const normalizedTokens = createTokenStub<MapTokenDoc>(
  (cid, mid, tid) => Paths.token(cid, mid, tid),
  (cid, mid) => Paths.tokens(cid, mid),
);

export const normalizedJournal = createDomainStub<JournalEntryDoc>(
  (cid, id) => Paths.journalEntry(cid, id),
  (cid) => Paths.journal(cid),
);

export const normalizedSessions = createDomainStub<SessionDoc>(
  (cid, id) => Paths.session(cid, id),
  (cid) => Paths.sessions(cid),
);

export const normalizedSessionCombatants = createTokenStub<SessionCombatantDoc>(
  (cid, sid, tid) => Paths.sessionCombatant(cid, sid, tid),
  (cid, sid) => Paths.sessionCombatants(cid, sid),
);

export const normalizedCombatLog = createDomainStub<CombatLogEntryDoc>(
  (cid, id) => Paths.combatLogEntry(cid, id),
  (cid) => Paths.combatLog(cid),
);

export const normalizedHomebrewItems = createDomainStub<HomebrewItemDoc>(
  (cid, id) => Paths.homebrewItem(cid, id),
  (cid) => Paths.homebrewItems(cid),
);

export const normalizedHomebrewSpells = createDomainStub<HomebrewSpellDoc>(
  (cid, id) => Paths.homebrewSpell(cid, id),
  (cid) => Paths.homebrewSpells(cid),
);

export const normalizedHomebrewFeats = createDomainStub<HomebrewFeatDoc>(
  (cid, id) => Paths.homebrewFeat(cid, id),
  (cid) => Paths.homebrewFeats(cid),
);

/* ── Sync Manager ───────────────────────────────────────────── */

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

  isListening(): boolean { return this.privateIsListening; },

  start(campaignId: string, callbacks?: SyncManagerCallbacks): void {
    this.stop(campaignId);
    const register = (key: string, unsub: Unsubscribe | null) => {
      if (unsub) this.privateUnsubscribers.set(`${campaignId}_${key}`, unsub);
    };
    register("meta", normalizedCampaign.listenMeta(campaignId, () => {}));
    if (callbacks?.onCharacters) register("chars", normalizedCharacters.listenAll(campaignId, callbacks.onCharacters));
    if (callbacks?.onEnemies) register("enemies", normalizedEnemies.listenAll(campaignId, callbacks.onEnemies));
    if (callbacks?.onEncounters) register("encs", normalizedEncounters.listenAll(campaignId, callbacks.onEncounters));
    if (callbacks?.onMaps) register("maps", normalizedMaps.listenAll(campaignId, callbacks.onMaps));
    if (callbacks?.onJournal) register("journal", normalizedJournal.listenAll(campaignId, callbacks.onJournal));
    if (callbacks?.onSessions) register("sessions", normalizedSessions.listenAll(campaignId, callbacks.onSessions));
    if (callbacks?.onCombatLog) register("combatLog", normalizedCombatLog.listenAll(campaignId, callbacks.onCombatLog));
    if (callbacks?.onItems) register("items", normalizedHomebrewItems.listenAll(campaignId, callbacks.onItems));
    if (callbacks?.onSpells) register("spells", normalizedHomebrewSpells.listenAll(campaignId, callbacks.onSpells));
    if (callbacks?.onFeats) register("feats", normalizedHomebrewFeats.listenAll(campaignId, callbacks.onFeats));
    this.privateIsListening = true;
  },

  listenTokens(campaignId: string, mapId: string, onChange: (tokens: MapTokenDoc[]) => void, onError?: (err: string) => void): Unsubscribe | null {
    const key = `${campaignId}_tokens_${mapId}`;
    this.privateUnsubscribers.get(key)?.();
    const unsub = normalizedTokens.listenAll(campaignId, mapId, onChange, onError);
    if (unsub) this.privateUnsubscribers.set(key, unsub);
    return unsub;
  },

  unlistenTokens(campaignId: string, mapId: string): void {
    const key = `${campaignId}_tokens_${mapId}`;
    this.privateUnsubscribers.get(key)?.();
    this.privateUnsubscribers.delete(key);
  },

  stop(campaignId?: string): void {
    if (campaignId) {
      for (const [key, unsub] of this.privateUnsubscribers) {
        if (key.startsWith(campaignId)) { unsub(); this.privateUnsubscribers.delete(key); }
      }
    } else {
      this.stopAll();
    }
    this.privateIsListening = this.privateUnsubscribers.size > 0;
  },

  stopAll(): void {
    for (const unsub of this.privateUnsubscribers.values()) unsub();
    this.privateUnsubscribers.clear();
    this.privateIsListening = false;
  },

  async pushAll(campaignId: string, campaignMeta: CampaignMeta, characters: CharacterDoc[], enemies: EnemyDoc[], encounters: EncounterDoc[], maps: MapDoc[], journals: JournalEntryDoc[]): Promise<boolean> {
    let allOk = true;
    if (!(await normalizedCampaign.pushMeta(campaignId, campaignMeta))) allOk = false;
    for (const c of characters) if (!(await normalizedCharacters.push(campaignId, c))) allOk = false;
    for (const e of enemies) if (!(await normalizedEnemies.push(campaignId, e))) allOk = false;
    for (const e of encounters) if (!(await normalizedEncounters.push(campaignId, e))) allOk = false;
    for (const m of maps) if (!(await normalizedMaps.push(campaignId, m))) allOk = false;
    for (const j of journals) if (!(await normalizedJournal.push(campaignId, j))) allOk = false;
    return allOk;
  },
};
