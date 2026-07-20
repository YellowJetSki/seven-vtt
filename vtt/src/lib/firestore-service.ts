// Re-export all Firebase Firestore services from domain modules
export { getCampaignMeta, setCampaignMeta, listenCampaignMeta } from "./firestore/campaign-service";
export {
  getCharacters, getCharacter, setCharacter, deleteCharacter,
  listenCharacters, batchSetCharacters,
} from "./firestore/character-service";
export {
  getEnemies, setEnemy,
  getEncounters, setEncounter,
  getBattleMaps, setBattleMap, deleteBattleMap,
  getMapTokens, setMapToken, deleteMapToken,
  listenMapTokens,
  getJournal, setJournalEntry,
  clearSubcollection,
} from "./firestore/entity-service";
export {
  getActiveEncounter, setActiveEncounter, deleteActiveEncounter,
  listenActiveEncounter,
  addLogEntry, getRecentLogEntries, listenCombatLog, clearCombatLog,
} from "./firestore/combat-service";
export { setDmShare, dismissDmShare, listenDmShare, clearDmShare } from "./firestore/share-service";
export type { DmSharePayload } from "./firestore/share-service";
