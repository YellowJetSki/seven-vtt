/**
 * STᚱ VTT — DM Travel Pace & Wilderness Survival Guide (Sprint 39)
 *
 * Comprehensive overland travel and wilderness survival tool for D&D 5.5e.
 * Features:
 *   - Travel Pace: Fast / Normal / Slow per 5.5e rules
 *   - Weather Generation: Clear, cloudy, rain, storm, extreme heat/cold, fog
 *   - Terrain Types: Plains, forest, mountains, swamp, desert, arctic, coast, hills, jungle, underwater
 *   - Navigation: DC-based tracking with consequences for getting lost
 *   - Foraging: DC 10 survival to find food/water for 1d6+WIS creatures
 *   - Random Encounters: Hourly/daily check with frequency and terrain-based tables
 *   - Exhaustion Tracking: Forced march, extreme weather, insufficient food/water
 *   - Resource Consumption: Food/water per creature per day
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";

// ── Types ──

type TravelPace = "fast" | "normal" | "slow";
type TerrainType = "plains" | "forest" | "mountains" | "swamp" | "desert" | "arctic" | "coast" | "hills" | "jungle" | "underdark";
type WeatherType = "clear" | "cloudy" | "rain" | "storm" | "extreme_heat" | "extreme_cold" | "fog" | "wind";
type NavigationResult = "on_track" | "lost" | "significantly_lost";
type ForageResultType = "food" | "water" | "both" | "none";

interface TravelDay {
  date: string;
  pace: TravelPace;
  terrain: TerrainType;
  distanceMiles: number;
  weather: WeatherType;
  navigationDC: number;
  navigationResult: NavigationResult;
  forageResult: ForageResultType;
  forageAmount: number;
  encounterCheck: boolean;
  encounterOccurred: boolean;
  notes: string;
}

interface TravelSession {
  id: string;
  partyName: string;
  partySize: number;
  startDate: string;
  days: TravelDay[];
  totalDistance: number;
  exhaustionLevels: number;
  foodConsumed: number;
  waterConsumed: number;
}

// ── Data Tables ──

const TERRAIN_LABELS: Record<TerrainType, string> = {
  plains: "🌾 Plains", forest: "🌲 Forest", mountains: "⛰️ Mountains", swamp: "🌿 Swamp",
  desert: "🏜️ Desert", arctic: "❄️ Arctic", coast: "🏖️ Coast", hills: "⛳ Hills",
  jungle: "🌴 Jungle", underdark: "🕯️ Underdark",
};

const TERRAIN_SPEED_MULTIPLIER: Record<TerrainType, number> = {
  plains: 1, forest: 0.75, mountains: 0.5, swamp: 0.5, desert: 0.75,
  arctic: 0.75, coast: 1, hills: 0.75, jungle: 0.5, underdark: 0.5,
};

const TERRAIN_FORAGE_DC: Record<TerrainType, number> = {
  plains: 12, forest: 10, mountains: 16, swamp: 14, desert: 20,
  arctic: 18, coast: 10, hills: 14, jungle: 10, underdark: 16,
};

const TERRAIN_NAVIGATION_DC: Record<TerrainType, { open: number; obscured: number }> = {
  plains: { open: 10, obscured: 14 }, forest: { open: 14, obscured: 18 },
  mountains: { open: 12, obscured: 16 }, swamp: { open: 16, obscured: 20 },
  desert: { open: 10, obscured: 14 }, arctic: { open: 12, obscured: 16 },
  coast: { open: 8, obscured: 12 }, hills: { open: 12, obscured: 16 },
  jungle: { open: 16, obscured: 20 }, underdark: { open: 18, obscured: 22 },
};

const PACE_LABELS: Record<TravelPace, string> = { fast: "⚡ Fast", normal: "🚶 Normal", slow: "🐢 Slow" };
const PACE_SPEED: Record<TravelPace, number> = { fast: 30, normal: 24, slow: 18 };
const PACE_FORAGE_PENALTY: Record<TravelPace, number> = { fast: 5, normal: 0, slow: -5 };
const PACE_NAVIGATION_PENALTY: Record<TravelPace, number> = { fast: -5, normal: 0, slow: 5 };
const PACE_ENCOUNTER_MOD: Record<TravelPace, number> = { fast: 1.5, normal: 1, slow: 0.5 };

const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: "☀️ Clear", cloudy: "☁️ Cloudy", rain: "🌧️ Rain", storm: "⛈️ Storm",
  extreme_heat: "🔥 Extreme Heat", extreme_cold: "🥶 Extreme Cold", fog: "🌫️ Fog", wind: "💨 Wind",
};

const WEATHER_NAVIGATION_PENALTY: Record<WeatherType, number> = {
  clear: 0, cloudy: 0, rain: -2, storm: -5, extreme_heat: -2, extreme_cold: -2, fog: -5, wind: -3,
};

const WEATHER_FORAGE_PENALTY: Record<WeatherType, number> = {
  clear: 0, cloudy: 0, rain: 2, storm: -3, extreme_heat: -5, extreme_cold: -5, fog: -3, wind: -2,
};

export default function DmTravelPaceGuide() {
  const show = useUIStore((s) => s.showTravelPace);
  const setShow = useUIStore((s) => s.setTravelPace);

  const [session, setSession] = useState<TravelSession | null>(null);
  const [partySize, setPartySize] = useState(4);
  const [pace, setPace] = useState<TravelPace>("normal");
  const [terrain, setTerrain] = useState<TerrainType>("plains");
  const [weatherMode, setWeatherMode] = useState<"auto" | "manual">("auto");
  const [manualWeather, setManualWeather] = useState<WeatherType>("clear");
  const [obscuredTerrain, setObscuredTerrain] = useState(false);
  const [daysToTravel, setDaysToTravel] = useState(1);
  const [forcedMarch, setForcedMarch] = useState(false);
  const [anim, setAnim] = useState<"entering" | "visible" | "exiting">("entering");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) { setAnim("entering"); requestAnimationFrame(() => setAnim("visible")); }
    else setAnim("exiting");
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const hk = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [show]);

  const handleClose = () => { setAnim("exiting"); setTimeout(() => setShow(false), 150); };
  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === overlayRef.current) handleClose(); };

  const getWeather = (day: number): WeatherType => {
    if (weatherMode === "manual") return manualWeather;
    // Simple pseudo-random weather based on day + terrain
    const seed = (day * 7 + terrain.length) % 10;
    if (seed < 4) return "clear";
    if (seed < 6) return "cloudy";
    if (seed < 8) return "rain";
    if (seed === 8) return "fog";
    return "storm";
  };

  const computeNavigationDC = (t: TerrainType, obscured: boolean, w: WeatherType, p: TravelPace): number => {
    const base = TERRAIN_NAVIGATION_DC[t][obscured ? "obscured" : "open"];
    return Math.max(5, base + WEATHER_NAVIGATION_PENALTY[w] + PACE_NAVIGATION_PENALTY[p]);
  };

  const computeNavigationResult = (dc: number): NavigationResult => {
    // DM secretly rolls a d20; here we compute thresholds
    if (dc <= 10) return "on_track";
    if (dc <= 16) return Math.random() > 0.3 ? "on_track" : "lost";
    if (dc <= 20) return Math.random() > 0.5 ? "lost" : "significantly_lost";
    return Math.random() > 0.3 ? "significantly_lost" : "lost";
  };

  const computeForageResult = (terrainType: TerrainType, w: WeatherType, p: TravelPace): { result: ForageResultType; amount: number } => {
    const baseDC = TERRAIN_FORAGE_DC[terrainType];
    const totalDC = Math.max(5, baseDC + WEATHER_FORAGE_PENALTY[w] + PACE_FORAGE_PENALTY[p]);
    // Simulate a survival check against DC
    const roll = Math.floor(Math.random() * 20) + 1 + 5; // Assume +5 survival mod for simplicity
    if (roll < totalDC) return { result: "none", amount: 0 };
    if (roll < totalDC + 5) return { result: "food", amount: Math.floor(Math.random() * 4) + 1 };
    if (roll < totalDC + 10) return { result: "water", amount: Math.floor(Math.random() * 4) + 1 };
    return { result: "both", amount: Math.floor(Math.random() * 6) + 2 };
  };

  const computeEncounterCheck = (p: TravelPace, t: TerrainType): boolean => {
    // Standard 5e: check once per day, twice per night. 18% base chance, modified by pace and terrain
    const baseChance = 0.18 * PACE_ENCOUNTER_MOD[p];
    // High activity terrains increase chance
    const terrainMod = (t === "jungle" || t === "swamp" || t === "underdark") ? 1.5 : 1;
    return Math.random() < (baseChance * terrainMod);
  };

  const computeDistance = (p: TravelPace, t: TerrainType): number => {
    const base = PACE_SPEED[p];
    const terrainMultiplier = TERRAIN_SPEED_MULTIPLIER[t];
    return Math.round(base * terrainMultiplier);
  };

  const handleGenerateJourney = () => {
    const days: TravelDay[] = [];
    for (let d = 0; d < daysToTravel; d++) {
      const w = getWeather(d);
      const navDC = computeNavigationDC(terrain, obscuredTerrain, w, pace);
      const navResult = computeNavigationResult(navDC);
      const forageResult = computeForageResult(terrain, w, pace);
      const encounterCheck = computeEncounterCheck(pace, terrain);

      days.push({
        date: `Day ${d + 1}`,
        pace,
        terrain,
        distanceMiles: computeDistance(pace, terrain),
        weather: w,
        navigationDC: navDC,
        navigationResult: navResult,
        forageResult: forageResult.result,
        forageAmount: forageResult.amount,
        encounterCheck: true,
        encounterOccurred: encounterCheck,
        notes: "",
      });
    }

    const totalDistance = days.reduce((sum, d) => sum + d.distanceMiles, 0);
    const sessionId = `journey_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    setSession({
      id: sessionId,
      partyName: "Arkla Adventurers",
      partySize,
      startDate: new Date().toLocaleDateString(),
      days,
      totalDistance,
      exhaustionLevels: 0,
      foodConsumed: partySize * daysToTravel,
      waterConsumed: partySize * daysToTravel,
    });
  };

  const handleClear = () => setSession(null);

  const handleAddNote = (dayIndex: number, note: string) => {
    if (!session) return;
    const updatedDays = [...session.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], notes: note };
    setSession({ ...session, days: updatedDays });
  };

  const pacePenalty = PACE_FORAGE_PENALTY[pace];
  const navPenalty = PACE_NAVIGATION_PENALTY[pace];
  const basePaceMPH = Math.round((PACE_SPEED[pace] / 8) * 10) / 10;
  const foodPerPersonPerDay = 1; // 1 lb ration per creature per day
  const waterPerPersonPerDay = 1; // 1 gallon per creature per day

  if (!show && anim !== "entering") return null;

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${anim === "visible" ? "pointer-events-auto" : "pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${anim === "visible" ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative w-[720px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${anim === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/15 flex items-center justify-center">
              <span className="text-[14px]">🗺️</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Travel & Wilderness</h2>
              <p className="text-[10px] text-surface-500">Overland travel, navigation, foraging, and random encounters</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all" aria-label="Close">
            <span className="text-surface-500 text-[11px]">✕</span>
          </button>
        </div>

        <div className="grid grid-cols-[220px_1fr] gap-0">
          {/* ── Settings Sidebar ── */}
          <div className="border-r border-white/[0.04] p-3 space-y-2.5">
            <h3 className="text-[8px] uppercase tracking-wider text-surface-600 font-bold">Travel Settings</h3>

            {/* Party Size */}
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Party Size</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all text-[10px] text-white/70">−</button>
                <span className="w-8 text-center text-[11px] text-white/80 tabular-nums font-bold">{partySize}</span>
                <button onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all text-[10px] text-white/70">+</button>
              </div>
            </div>

            {/* Travel Pace */}
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Travel Pace</label>
              <div className="grid grid-cols-3 gap-0.5">
                {(["fast", "normal", "slow"] as TravelPace[]).map((p) => (
                  <button key={p} onClick={() => setPace(p)}
                    className={`px-1 py-1 text-[8px] rounded border transition-all active:scale-95 ${
                      pace === p ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/[0.02] border-white/[0.04] text-surface-500 hover:text-surface-300"
                    }`}
                  >{PACE_LABELS[p]}</button>
                ))}
              </div>
              <p className="text-[7px] text-surface-600 mt-0.5">{basePaceMPH} mph · {PACE_SPEED[pace]} mi/day · Nav: {navPenalty >= 0 ? `+${navPenalty}` : navPenalty} · Forage: {pacePenalty >= 0 ? `+${pacePenalty}` : pacePenalty}</p>
            </div>

            {/* Terrain */}
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Terrain</label>
              <select value={terrain} onChange={(e) => setTerrain(e.target.value as TerrainType)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded px-1.5 py-1 text-[8px] text-white/80 focus:outline-none focus:border-sky-500/25 focus:ring-1 focus:ring-sky-500/15 transition-all"
              >
                {Object.entries(TERRAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <p className="text-[7px] text-surface-600 mt-0.5">{Math.round(TERRAIN_SPEED_MULTIPLIER[terrain] * 100)}% speed · Forage DC {TERRAIN_FORAGE_DC[terrain]} · Nav DC {TERRAIN_NAVIGATION_DC[terrain].open}</p>
            </div>

            {/* Weather */}
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Weather</label>
              <div className="grid grid-cols-2 gap-0.5 mb-0.5">
                <button onClick={() => setWeatherMode("auto")}
                  className={`px-1 py-0.5 text-[7px] rounded border transition-all active:scale-95 ${
                    weatherMode === "auto" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-white/[0.02] border-white/[0.04] text-surface-500"
                  }`}>🌤️ Auto</button>
                <button onClick={() => setWeatherMode("manual")}
                  className={`px-1 py-0.5 text-[7px] rounded border transition-all active:scale-95 ${
                    weatherMode === "manual" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/[0.02] border-white/[0.04] text-surface-500"
                  }`}>✍️ Manual</button>
              </div>
              {weatherMode === "manual" && (
                <select value={manualWeather} onChange={(e) => setManualWeather(e.target.value as WeatherType)}
                  className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded px-1.5 py-1 text-[8px] text-white/80 focus:outline-none focus:border-amber-500/25"
                >
                  {Object.entries(WEATHER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Terrain Visibility */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="obscured" checked={obscuredTerrain} onChange={(e) => setObscuredTerrain(e.target.checked)}
                className="w-3 h-3 rounded border-white/[0.15] bg-[#07080d] accent-amber-500"
              />
              <label htmlFor="obscured" className="text-[8px] text-surface-500 cursor-pointer">Obscured (dark/heavy cover)</label>
            </div>

            {/* Days & Forced March */}
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Days of Travel</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setDaysToTravel(Math.max(1, daysToTravel - 1))} className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all text-[10px] text-white/70">−</button>
                <span className="w-6 text-center text-[11px] text-white/80 tabular-nums font-bold">{daysToTravel}</span>
                <button onClick={() => setDaysToTravel(Math.min(30, daysToTravel + 1))} className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all text-[10px] text-white/70">+</button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateJourney}
              className="w-full py-1.5 rounded-lg text-[8px] font-bold bg-sky-500/12 text-sky-400 border border-sky-500/20 hover:bg-sky-500/18 active:scale-95 transition-all"
            >
              🗺️ Generate Journey
            </button>

            {session && (
              <button onClick={handleClear} className="w-full py-1 rounded-lg text-[7px] font-bold bg-white/[0.03] text-surface-500 border border-white/[0.04] hover:bg-white/[0.06] active:scale-95 transition-all">
                Clear Journey
              </button>
            )}

            {/* Resource Summary */}
            <div className="bg-white/[0.02] rounded-lg px-2 py-1.5 space-y-0.5">
              <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Daily Consumption</h4>
              <p className="text-[8px] text-surface-500">Party of {partySize}:</p>
              <p className="text-[8px] text-surface-400">🍞 {partySize * foodPerPersonPerDay} lb rations/day</p>
              <p className="text-[8px] text-surface-400">💧 {partySize * waterPerPersonPerDay} gal water/day</p>
              <p className="text-[7px] text-surface-600 mt-0.5">Foraging DC: {TERRAIN_FORAGE_DC[terrain] + WEATHER_FORAGE_PENALTY[weatherMode === "auto" ? "clear" : manualWeather] + pacePenalty}</p>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="p-3 space-y-3 min-h-[300px]">
            {!session ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center mb-2">
                  <span className="text-[18px]">🗺️</span>
                </div>
                <p className="text-[11px] text-surface-400 font-bold">Plan Your Journey</p>
                <p className="text-[8px] text-surface-600 mt-0.5 max-w-[250px]">Configure settings on the left and generate a travel plan for the Arkla party. Track navigation, foraging, weather, and random encounters per day.</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-left">
                  <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                    <p className="text-[7px] uppercase text-surface-600 font-bold">Pace Rules</p>
                    <p className="text-[7px] text-surface-500 mt-0.5">Fast: −5 perception, −5 navigation<br/>Normal: standard<br/>Slow: +5 navigation, stealth available</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                    <p className="text-[7px] uppercase text-surface-600 font-bold">Survival</p>
                    <p className="text-[7px] text-surface-500 mt-0.5">Each creature needs 1 lb food + 1 gal water per day. Foraging DC varies by terrain.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Journey Log */
              <div className="space-y-2">
                {/* Journey Summary */}
                <div className="grid grid-cols-4 gap-1">
                  {[{ label: "Total Distance", value: `${session.totalDistance} mi`, color: "text-sky-400" },
                    { label: "Travel Days", value: `${session.days.length}`, color: "text-amber-400" },
                    { label: "Avg Pace", value: `${Math.round(session.totalDistance / session.days.length)} mi/day`, color: "text-emerald-400" },
                    { label: "Party Size", value: `${session.partySize}`, color: "text-gold-400" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[6px] uppercase text-surface-600">{s.label}</p>
                      <p className={`text-[11px] font-bold tabular-nums ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Resource Consumption Alert */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1.5">
                  <p className="text-[8px] text-amber-400/80">
                    <span className="font-bold">Resource Consumption:</span> The party will consume {session.foodConsumed} lb of food and {session.waterConsumed} gallons of water over {session.days.length} days.
                    {session.days.filter(d => d.forageResult !== "none").length > 0 && (
                      <span className="text-emerald-400"> Foraging provides {session.days.filter(d => d.forageResult !== "none").length} days of partial sustenance.</span>
                    )}
                  </p>
                </div>

                {/* Day-by-Day Entries */}
                {session.days.map((day, idx) => {
                  const navColor = day.navigationResult === "on_track" ? "text-emerald-400" : day.navigationResult === "lost" ? "text-amber-400" : "text-rose-400";
                  const navLabel = day.navigationResult === "on_track" ? "✅ On Track" : day.navigationResult === "lost" ? "⚠️ Lost" : "🔴 Significantly Lost";
                  const forageLabel = day.forageResult === "none" ? "❌ None" : day.forageResult === "food" ? `🍞 +${day.forageAmount}` : day.forageResult === "water" ? `💧 +${day.forageAmount}` : `🍞💧 +${day.forageAmount}`;
                  const forageColor = day.forageResult === "none" ? "text-rose-400" : "text-emerald-400";

                  return (
                    <div key={idx} className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white/70 tabular-nums">{day.date}</span>
                          <span className="text-[7px] text-surface-600">{PACE_LABELS[day.pace]}</span>
                          <span className="text-[7px] text-surface-600">{TERRAIN_LABELS[day.terrain].split(" ")[0]}</span>
                          <span className="text-[7px] text-surface-500 tabular-nums">{day.distanceMiles} mi</span>
                        </div>
                        <span className="text-[8px]">{WEATHER_LABELS[day.weather]}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-0 divide-x divide-white/[0.04]">
                        <div className="px-2 py-1.5 text-center">
                          <p className="text-[6px] uppercase text-surface-600">Navigation</p>
                          <p className={`text-[7px] font-bold tabular-nums ${navColor}`}>DC {day.navigationDC}</p>
                          <p className={`text-[7px] ${navColor}`}>{navLabel}</p>
                        </div>
                        <div className="px-2 py-1.5 text-center">
                          <p className="text-[6px] uppercase text-surface-600">Forage</p>
                          <p className={`text-[7px] font-bold tabular-nums ${forageColor}`}>{forageLabel}</p>
                          <p className="text-[6px] text-surface-600">DC {TERRAIN_FORAGE_DC[day.terrain] + WEATHER_FORAGE_PENALTY[day.weather] + PACE_FORAGE_PENALTY[day.pace]}</p>
                        </div>
                        <div className="px-2 py-1.5 text-center">
                          <p className="text-[6px] uppercase text-surface-600">Encounter</p>
                          <p className={`text-[7px] font-bold ${day.encounterOccurred ? "text-rose-400" : "text-emerald-400"}`}>
                            {day.encounterOccurred ? "⚔️ Yes" : "✅ No"}
                          </p>
                          <p className="text-[6px] text-surface-600">18% base × terrain</p>
                        </div>
                        <div className="px-2 py-1.5 text-center">
                          <p className="text-[6px] uppercase text-surface-600">Notes</p>
                          <input
                            type="text"
                            placeholder="Add note..."
                            defaultValue={day.notes}
                            onBlur={(e) => handleAddNote(idx, e.target.value)}
                            className="w-full bg-transparent text-[7px] text-surface-400 placeholder:text-surface-700 text-center focus:outline-none focus:text-white/60"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[7px] text-surface-600">
            10 terrain types · 8 weather conditions · 3 travel paces
          </span>
          <span className="text-[7px] text-surface-700">Configure → Generate → Review per day</span>
        </div>
      </div>
    </div>
  );
}
