import { useState, useCallback, useRef } from "react";

const SRD_BASE = "https://www.dnd5eapi.co/api";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface SrdCacheEntry<T> {
  data: T;
  timestamp: number;
}

/* ── Spell Interface ────────────────────────────────────────── */

export interface SrdSpell {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string[];
  higher_level?: string[];
  damage?: {
    damage_type?: { name: string };
    damage_at_slot_level?: Record<string, string>;
  };
  dc?: {
    dc_type: { name: string };
    dc_success: string;
  };
  classes: { name: string }[];
  subclasses?: { name: string }[];
}

/* ── Monster Interface ──────────────────────────────────────── */

export interface SrdMonster {
  index: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armor_class: { value: number }[];
  hit_points: number;
  hit_dice: string;
  speed: Record<string, string>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencies: { value: number; proficiency: { name: string } }[];
  damage_vulnerabilities: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: string[];
  senses: string;
  languages: string;
  challenge_rating: number;
  xp: number;
  special_abilities?: { name: string; description: string }[];
  actions?: { name: string; desc: string; attack_bonus?: number; damage?: { damage_dice: string; damage_type: { name: string } }[] }[];
  legendary_actions?: { name: string; desc: string }[];
  image?: string;
}

/* ── Equipment Interface ────────────────────────────────────── */

export interface SrdEquipment {
  index: string;
  name: string;
  equipment_category: { name: string };
  cost: { quantity: number; unit: string };
  weight?: number;
  desc?: string[];
  weapon_category?: string;
  weapon_range?: string;
  damage?: { damage_dice: string; damage_type: { name: string } };
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  stealth_disadvantage?: boolean;
  contents?: { item: { name: string }; quantity: number }[];
}

/* ── Condition Interface ────────────────────────────────────── */

export interface SrdCondition {
  index: string;
  name: string;
  desc: string[];
}

/* ── SRD API Hook ───────────────────────────────────────────── */

export function useSrdApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, SrdCacheEntry<unknown>>>(new Map());

  const getCached = useCallback(<T>(key: string): T | null => {
    const entry = cache.current.get(key) as SrdCacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  }, []);

  const setCached = useCallback(<T>(key: string, data: T): void => {
    cache.current.set(key, { data, timestamp: Date.now() });
  }, []);

  const fetchSpell = useCallback(async (name: string): Promise<SrdSpell | null> => {
    const cacheKey = `spell_${name.toLowerCase().replace(/\s+/g, "-")}`;
    const cached = getCached<SrdSpell>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const index = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await fetch(`${SRD_BASE}/spells/${index}`);
      if (!res.ok) throw new Error(`Spell "${name}" not found`);
      const data: SrdSpell = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch spell");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  const searchSpells = useCallback(async (query: string): Promise<SrdSpell[]> => {
    const cacheKey = `search_spells_${query}`;
    const cached = getCached<SrdSpell[]>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SRD_BASE}/spells`);
      if (!res.ok) throw new Error("Failed to search spells");
      const data: { results: { index: string; name: string }[] } = await res.json();
      const q = query.toLowerCase();
      const matches = data.results.filter((s) => s.name.toLowerCase().includes(q));
      if (matches.length === 0) return [];

      // Fetch full details for matches (limit to 10 for performance)
      const fullSpells = await Promise.all(
        matches.slice(0, 10).map(async (s) => {
          const res = await fetch(`${SRD_BASE}/spells/${s.index}`);
          if (!res.ok) return null;
          return res.json() as Promise<SrdSpell>;
        })
      );
      const results = fullSpells.filter((s): s is SrdSpell => s !== null);
      setCached(cacheKey, results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search spells");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  const fetchMonster = useCallback(async (name: string): Promise<SrdMonster | null> => {
    const cacheKey = `monster_${name.toLowerCase().replace(/\s+/g, "-")}`;
    const cached = getCached<SrdMonster>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const index = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await fetch(`${SRD_BASE}/monsters/${index}`);
      if (!res.ok) throw new Error(`Monster "${name}" not found`);
      const data: SrdMonster = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch monster");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  const searchMonsters = useCallback(async (query: string): Promise<{ index: string; name: string }[]> => {
    const cacheKey = `search_monsters_${query}`;
    const cached = getCached<{ index: string; name: string }[]>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SRD_BASE}/monsters`);
      if (!res.ok) throw new Error("Failed to search monsters");
      const data: { results: { index: string; name: string }[] } = await res.json();
      const q = query.toLowerCase();
      const results = data.results.filter((m) => m.name.toLowerCase().includes(q));
      setCached(cacheKey, results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search monsters");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  const fetchEquipment = useCallback(async (name: string): Promise<SrdEquipment | null> => {
    const cacheKey = `equipment_${name.toLowerCase().replace(/\s+/g, "-")}`;
    const cached = getCached<SrdEquipment>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const index = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await fetch(`${SRD_BASE}/equipment/${index}`);
      if (!res.ok) throw new Error(`Equipment "${name}" not found`);
      const data: SrdEquipment = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch equipment");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  const fetchConditions = useCallback(async (): Promise<SrdCondition[]> => {
    const cacheKey = "all_conditions";
    const cached = getCached<SrdCondition[]>(cacheKey);
    if (cached) return cached;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SRD_BASE}/conditions`);
      if (!res.ok) throw new Error("Failed to fetch conditions");
      const data: { results: { index: string }[] } = await res.json();

      const fullConditions = await Promise.all(
        data.results.map(async (c) => {
          const res = await fetch(`${SRD_BASE}/conditions/${c.index}`);
          if (!res.ok) return null;
          return res.json() as Promise<SrdCondition>;
        })
      );
      const results = fullConditions.filter((c): c is SrdCondition => c !== null);
      setCached(cacheKey, results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conditions");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCached, setCached]);

  return {
    isLoading,
    error,
    fetchSpell,
    searchSpells,
    fetchMonster,
    searchMonsters,
    fetchEquipment,
    fetchConditions,
  };
}
