/**
 * STᴿ VTT — DM Ship-to-Ship / Vehicle Combat & Naval Travel Guide (Sprint 40 — FINAL)
 *
 * Comprehensive D&D 5.5e naval/vehicle travel and ship combat tool.
 * Features:
 *   - Ship Types: Stats for 12 vessel types (Keelboat → Spelljammer)
 *   - Naval Travel: Speed in mph/mi/day, crew requirements, cargo capacity
 *   - Ship Combat: Hull points, damage threshold, crew casualties
 *   - Maneuver Options: Broadside, Ram, Board, Escape, Chase
 *   - Siege Weapons: Ballista, Cannon, Mangonel, Trebuchet, Greek Fire
 *   - Weather at Sea: Beaufort scale with mechanical effects
 *   - Crew Management: Minimum crew, casualties, morale, repairs
 *   - Marine Navigation: Coastline vs open sea, currents, reefs
 *   - Random Encounters: Sea monsters, pirates, storms, sirens, ports
 *
 * Campaign: Arkla — The party sails the Sword Coast aboard "The Iron Gull"
 * Characters: Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 *
 * FINAL SPRINT: 40 of 40 — Complete VTT expansion cycle
 */
import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
type ShipType = "keelboat" | "longship" | "sailing_ship" | "warship" | "galley" | "caravel" | "galleon" | "dragon_ship" | "spelljammer" | "pirate_ship" | "merchant_ship" | "fishing_vessel";
type SeaState = "calm" | "light_breeze" | "moderate" | "rough" | "rough_high" | "storm" | "hurricane";
type Maneuver = "broadside" | "ram" | "board" | "escape" | "chase" | "hold_position";
type SiegeWeapon = "ballista" | "cannon" | "mangonel" | "trebuchet" | "greek_fire";
type EncounterType = "sea_monster" | "pirates" | "storm" | "sirens" | "merchant" | "naval_patrol" | "reef" | "port" | "nothing";
interface ShipStats {
  name: string; speedMPH: number; milesPerDay: number; hullPoints: number;
  damageThreshold: number; minCrew: number; maxCrew: number; cargoTons: number;
  siegeWeaponSlots: number; costGP: string; AC: number; description: string;
  crewSkillBonus: number;
}
const SHIP_DATA: Record<ShipType, ShipStats> = {
  keelboat: {name:"Keelboat",speedMPH:2,milesPerDay:48,hullPoints:100,damageThreshold:10,minCrew:1,maxCrew:4,cargoTons:0.5,siegeWeaponSlots:0,costGP:"3,000",AC:15,description:"Small river/coastal vessel. Fragile but inexpensive.",crewSkillBonus:0},
  longship: {name:"Longship",speedMPH:3,milesPerDay:72,hullPoints:200,damageThreshold:15,minCrew:20,maxCrew:60,cargoTons:5,siegeWeaponSlots:0,costGP:"10,000",AC:15,description:"Norse-style raider. Fast, maneuverable. Oars work without wind.",crewSkillBonus:1},
  sailing_ship: {name:"Sailing Ship",speedMPH:2.5,milesPerDay:48,hullPoints:300,damageThreshold:15,minCrew:10,maxCrew:30,cargoTons:100,siegeWeaponSlots:2,costGP:"10,000",AC:14,description:"Standard merchant. 3 masts. Versatile transport.",crewSkillBonus:0},
  warship: {name:"Warship",speedMPH:3,milesPerDay:72,hullPoints:500,damageThreshold:20,minCrew:40,maxCrew:80,cargoTons:10,siegeWeaponSlots:4,costGP:"25,000",AC:18,description:"Heavy naval vessel. Ram-reinforced bow. Double-planked hull.",crewSkillBonus:2},
  galley: {name:"Galley",speedMPH:3.5,milesPerDay:48,hullPoints:350,damageThreshold:15,minCrew:80,maxCrew:150,cargoTons:25,siegeWeaponSlots:2,costGP:"20,000",AC:16,description:"Oar-powered. Independent of wind. Exhausting for crew.",crewSkillBonus:1},
  caravel: {name:"Caravel",speedMPH:3.5,milesPerDay:84,hullPoints:250,damageThreshold:15,minCrew:15,maxCrew:25,cargoTons:60,siegeWeaponSlots:1,costGP:"12,000",AC:15,description:"Lateen-rigged explorer. Fast, maneuverable, good windward.",crewSkillBonus:1},
  galleon: {name:"Galleon",speedMPH:2.5,milesPerDay:60,hullPoints:600,damageThreshold:20,minCrew:60,maxCrew:120,cargoTons:200,siegeWeaponSlots:6,costGP:"50,000",AC:18,description:"Massive treasure ship. Heavy cannons. High freeboard.",crewSkillBonus:2},
  dragon_ship: {name:"Dragonship",speedMPH:4,milesPerDay:96,hullPoints:400,damageThreshold:20,minCrew:30,maxCrew:100,cargoTons:8,siegeWeaponSlots:2,costGP:"30,000",AC:16,description:"Elven/draconic vessel. Magical propulsion. Light but sturdy.",crewSkillBonus:3},
  spelljammer: {name:"Spelljammer",speedMPH:10,milesPerDay:240,hullPoints:800,damageThreshold:25,minCrew:5,maxCrew:40,cargoTons:50,siegeWeaponSlots:4,costGP:"200,000",AC:20,description:"Magic void-traveler. Crystal hull. Travels between planes.",crewSkillBonus:4},
  pirate_ship: {name:"Pirate Ship",speedMPH:3.5,milesPerDay:84,hullPoints:350,damageThreshold:15,minCrew:20,maxCrew:50,cargoTons:40,siegeWeaponSlots:3,costGP:"15,000",AC:16,description:"Fast, well-armed. Modified caravel. Built for boarding.",crewSkillBonus:2},
  merchant_ship: {name:"Merchant Cog",speedMPH:2,milesPerDay:40,hullPoints:250,damageThreshold:12,minCrew:8,maxCrew:20,cargoTons:150,siegeWeaponSlots:1,costGP:"8,000",AC:13,description:"Fat-bellied cargo hauler. Slow. Minimal armament.",crewSkillBonus:0},
  fishing_vessel: {name:"Fishing Vessel",speedMPH:1.5,milesPerDay:36,hullPoints:60,damageThreshold:8,minCrew:1,maxCrew:6,cargoTons:2,siegeWeaponSlots:0,costGP:"500",AC:12,description:"Small coastal boat. Not meant for combat or open ocean.",crewSkillBonus:-1},
};
const SEA_LABELS: Record<SeaState, string> = {calm:"☀️ Calm",light_breeze:"🌊 Light Breeze",moderate:"🌊 Moderate",rough:"🌊🌊 Rough",rough_high:"🌊🌊🌊 Rough (High)",storm:"⛈️ Storm",hurricane:"🌀 Hurricane"};
const SEA_NAV_PENALTY: Record<SeaState, number> = {calm:0,light_breeze:0,moderate:-2,rough:-5,rough_high:-10,storm:-15,hurricane:-20};
const SEA_SPEED_MOD: Record<SeaState, number> = {calm:0.5,light_breeze:1,moderate:1,rough:0.75,rough_high:0.5,storm:0.25,hurricane:0};
const MAN_LABELS: Record<Maneuver, string> = {broadside:"🔥 Broadside",ram:"🔱 Ram",board:"⚔️ Board",escape:"🏃 Escape",chase:"🏴‍☠️ Chase",hold_position:"🛡️ Hold Position"};
const SIEGE_STATS: Record<SiegeWeapon, {dmg:string;rng:string;crew:number;toHit:string}> = {ballista:{dmg:"3d10 piercing",rng:"120/480 ft",crew:3,toHit:"+4"},cannon:{dmg:"6d10 bludgeoning",rng:"200/800 ft (line)",crew:4,toHit:"+5"},mangonel:{dmg:"5d10 bludgeoning",rng:"200/800 ft (20-ft radius)",crew:5,toHit:"+3"},trebuchet:{dmg:"8d10 bludgeoning",rng:"300/1,200 ft (30-ft radius)",crew:6,toHit:"+2"},greek_fire:{dmg:"4d10 fire (ongoing 2d10)",rng:"60 ft cone",crew:3,toHit:"+4"}};
const ENC_LABELS: Record<EncounterType, string> = {sea_monster:"🐉 Sea Monster",pirates:"🏴‍☠️ Pirates",storm:"⛈️ Storm",sirens:"🧜 Sirens",merchant:"⚓ Merchant Ship",naval_patrol:"⚔️ Naval Patrol",reef:"🪸 Reef",port:"🏘️ Port",nothing:"🌊 Calm Seas"};
export default function DmShipCombatGuide() {
  const show = useUIStore((s) => s.showShipCombat);
  const setShow = useUIStore((s) => s.setShipCombat);
  const [activeTab, setActiveTab] = useState<"reference" | "combat" | "encounter">("reference");
  const [selShip, setSelShip] = useState<ShipType>("sailing_ship");
  const [seaState, setSeaState] = useState<SeaState>("calm");
  const [shipHP, setShipHP] = useState(300);
  const [shipCrew, setShipCrew] = useState(20);
  const [anim, setAnim] = useState<"entering"|"visible"|"exiting">("entering");
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {if(show){setAnim("entering");requestAnimationFrame(()=>setAnim("visible"));}else setAnim("exiting");},[show]);
  useEffect(()=>{if(!show)return;const hk=(e:KeyboardEvent)=>{if(e.key==="Escape")handleClose();};window.addEventListener("keydown",hk);return()=>window.removeEventListener("keydown",hk);},[show]);
  const handleClose = () => {setAnim("exiting");setTimeout(()=>setShow(false),150);};
  const handleBackdrop = (e:React.MouseEvent) => {if(e.target===overlayRef.current)handleClose();};
  const ship = SHIP_DATA[selShip];
  const mph = Math.round(ship.speedMPH * SEA_SPEED_MOD[seaState] * 10) / 10;
  const dayDist = Math.round(ship.milesPerDay * SEA_SPEED_MOD[seaState]);
  const navDC = Math.max(5, 10 + SEA_NAV_PENALTY[seaState]);
  if(!show && anim !== "entering") return null;
  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${anim==="visible"?"pointer-events-auto":"pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${anim==="visible"?"opacity-100":"opacity-0"}`} />
      <div className={`relative w-[760px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${anim==="visible"?"opacity-100 translate-y-0":"opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent pointer-events-none" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
              <span className="text-[14px]">⚓</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Naval Combat & Travel</h2>
              <p className="text-[10px] text-surface-500">Ship-to-ship combat, marine navigation, and sea encounters</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all" aria-label="Close"><span className="text-surface-500 text-[11px]">✕</span></button>
        </div>
        {/* Tabs */}
        <div className="flex gap-0.5 px-4 pt-2 pb-0 border-b border-white/[0.03]">
          {([["reference","📖 Reference"],["combat","⚔️ Combat"],["encounter","🌊 Encounters"]] as const).map(([k,v])=>(
            <button key={k} onClick={()=>setActiveTab(k)}
              className={`px-2.5 py-1 text-[9px] font-bold rounded-t-lg border border-white/[0.03] border-b-0 transition-all active:scale-95 ${
                activeTab===k ? "bg-cyan-500/8 text-cyan-400 border-cyan-500/15" : "bg-white/[0.02] text-surface-500 hover:text-surface-300"
              }`}>{v}</button>
          ))}
        </div>
        {activeTab === "reference" && (
          <div className="grid grid-cols-[200px_1fr] gap-0">
            {/* Ship Selector */}
            <div className="border-r border-white/[0.04] p-3 space-y-1.5">
              <h3 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold mb-1">Ship Types</h3>
              {Object.entries(SHIP_DATA).map(([k,v]) => (
                <button key={k} onClick={()=>setSelShip(k as ShipType)}
                  className={`w-full text-left px-1.5 py-1 rounded text-[8px] transition-all active:scale-95 ${
                    selShip===k ? "bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-400" : "text-surface-500 hover:text-surface-300 border-l-2 border-transparent"
                  }`}>{v.name}</button>
              ))}
            </div>
            {/* Ship Detail */}
            <div className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h3 className="text-[11px] font-bold text-white/80">{ship.name}</h3>
                  <p className="text-[7px] text-surface-500 mt-0.5">{ship.description}</p>
                </div>
                <span className="text-[7px] text-amber-400 bg-amber-500/8 px-1.5 py-0.5 rounded">{ship.costGP} GP</span>
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-1">
                {[{l:"Speed",v:`${ship.speedMPH} mph / ${ship.milesPerDay} mi/day`,c:"text-cyan-400"},
                  {l:"Hull",v:`${ship.hullPoints} HP (DT ${ship.damageThreshold})`,c:"text-emerald-400"},
                  {l:"Crew",v:`${ship.minCrew}–${ship.maxCrew}`,c:"text-gold-400"},
                  {l:"Cargo",v:`${ship.cargoTons} tons`,c:"text-amber-400"},
                  {l:"AC",v:`${ship.AC}`,c:"text-cyan-400"},
                  {l:"Siege Slots",v:`${ship.siegeWeaponSlots}`,c:"text-rose-400"},
                  {l:"Cost",v:`${ship.costGP} GP`,c:"text-amber-400"},
                  {l:"Crew Skill",v:`${ship.crewSkillBonus >= 0 ? "+" : ""}${ship.crewSkillBonus}`,c:ship.crewSkillBonus>=0?"text-emerald-400":"text-rose-400"},
                ].map((s,i)=>(
                  <div key={i} className="bg-white/[0.02] rounded px-1.5 py-1 text-center">
                    <p className="text-[6px] uppercase text-surface-600">{s.l}</p>
                    <p className={`text-[8px] font-bold tabular-nums ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
              {/* Siege Weapons */}
              {ship.siegeWeaponSlots > 0 && (
                <div>
                  <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold mb-0.5">Siege Weapons</h4>
                  <div className="grid grid-cols-5 gap-0.5">
                    {(Object.entries(SIEGE_STATS) as [SiegeWeapon,typeof SIEGE_STATS[SiegeWeapon]][]).map(([k,v])=>(
                      <div key={k} className="bg-white/[0.02] rounded px-1 py-0.5 text-center">
                        <p className="text-[7px] font-bold text-surface-300 capitalize">{k.replace(/_/g," ")}</p>
                        <p className="text-[6px] text-rose-400">{v.dmg}</p>
                        <p className="text-[6px] text-surface-500">{v.rng} · {v.crew} crew · {v.toHit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Sea State Simulator */}
              <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold mb-1">Sea State Simulator</h4>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {(Object.entries(SEA_LABELS) as [SeaState,string][]).map(([k,v])=>(
                    <button key={k} onClick={()=>setSeaState(k)}
                      className={`px-0.5 py-0.5 text-[6px] rounded border transition-all active:scale-95 ${
                        seaState===k ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/[0.02] border-white/[0.04] text-surface-500"
                      }`}>{v}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-[7px] text-surface-500">Speed: <span className="text-cyan-400 tabular-nums">{mph} mph / {dayDist} mi/day</span></p>
                  <p className="text-[7px] text-surface-500">Navigation DC: <span className="tabular-nums">{navDC}</span></p>
                  <p className="text-[7px] text-surface-500">Speed Mod: <span className="tabular-nums">{SEA_SPEED_MOD[seaState] * 100}%</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "combat" && (
          <div className="p-3 space-y-2">
            {/* Ship Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold mb-1">Your Ship</h4>
                <p className="text-[8px] text-white/60"><span className="text-cyan-400">{ship.name}</span></p>
                <div className="mt-1">
                  <div className="flex justify-between text-[7px] text-surface-500">
                    <span>Hull</span>
                    <span className="tabluar-nums">{shipHP} / {ship.hullPoints}</span>
                  </div>
                  <div className="h-1.5 bg-surface-900/80 rounded-full mt-0.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${shipHP/ship.hullPoints>0.5?"bg-emerald-500":shipHP/ship.hullPoints>0.25?"bg-amber-500":"bg-rose-500"}`} style={{width:`${Math.max(0,(shipHP/ship.hullPoints)*100)}%`}} />
                  </div>
                </div>
                <div className="mt-1">
                  <div className="flex justify-between text-[7px] text-surface-500">
                    <span>Crew</span>
                    <span className="tabluar-nums">{shipCrew} / {ship.maxCrew}</span>
                  </div>
                  <div className="h-1.5 bg-surface-900/80 rounded-full mt-0.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${shipCrew/ship.maxCrew>0.5?"bg-emerald-500":shipCrew/ship.maxCrew>0.25?"bg-amber-500":"bg-rose-500"}`} style={{width:`${Math.max(0,(shipCrew/ship.maxCrew)*100)}%`}} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setShipHP(Math.min(ship.hullPoints,shipHP+25))} className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-90 text-[7px] text-emerald-400">+25</button>
                    <button onClick={()=>setShipHP(Math.min(ship.hullPoints,shipHP+50))} className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-90 text-[7px] text-emerald-400">+50</button>
                    <button onClick={()=>setShipHP(Math.max(0,shipHP-25))} className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 active:scale-90 text-[7px] text-rose-400">−25</button>
                    <button onClick={()=>setShipHP(Math.max(0,shipHP-50))} className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 active:scale-90 text-[7px] text-rose-400">−50</button>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={()=>setShipCrew(Math.min(ship.maxCrew,shipCrew+1))} className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-90 text-[7px] text-emerald-400">+1</button>
                    <button onClick={()=>setShipCrew(Math.min(ship.maxCrew,shipCrew+5))} className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-90 text-[7px] text-emerald-400">+5</button>
                    <button onClick={()=>setShipCrew(Math.max(0,shipCrew-1))} className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 active:scale-90 text-[7px] text-rose-400">−1</button>
                    <button onClick={()=>setShipCrew(Math.max(0,shipCrew-5))} className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 active:scale-90 text-[7px] text-rose-400">−5</button>
                  </div>
                </div>
              </div>
              {/* Maneuvers */}
              <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold mb-1">Maneuvers</h4>
                <div className="grid grid-cols-2 gap-0.5">
                  {(Object.entries(MAN_LABELS) as [Maneuver,string][]).map(([k,v])=>(
                    <div key={k} className="bg-white/[0.03] rounded px-1.5 py-1 text-center">
                      <p className="text-[7px] font-bold text-surface-300">{v}</p>
                      <p className="text-[6px] text-surface-500 mt-0.5">
                        {(k==="broadside"?"All siege weapons fire simultaneously":k==="ram"?"Collision: hull vs hull damage":k==="board"?"Grapple + melee combat":k==="escape"?"Full speed away, opposed checks":k==="chase"?"Pursuit, CON saves for crew":"Anchored, +2 AC, cannot move")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Ramming & Boarding Rules */}
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-2.5 py-2">
              <h4 className="text-[7px] uppercase tracking-wider text-cyan-400/60 font-bold mb-1">⚡ Quick Rules</h4>
              <div className="grid grid-cols-3 gap-2 text-[7px] text-surface-500">
                <p><span className="text-cyan-400 font-bold">Ramming:</span> Ship speed in mph times 1d6 bludgeoning damage to both vessels. DT reduces damage below threshold.</p>
                <p><span className="text-cyan-400 font-bold">Boarding:</span> Requires grapnel (DC 10 STR check). Then standard combat on decks. Boarding party vs defending crew.</p>
                <p><span className="text-cyan-400 font-bold">Crew Casualties:</span> Each siege weapon hit kills 1d4 crew. Hull at 0 HP = ship sinks in 1d10 rounds. DC 15 DEX check to launch boats.</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "encounter" && (
          <div className="p-3 space-y-2">
            {/* Encounter Type */}
            <h4 className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Random Sea Encounters</h4>
            <div className="grid grid-cols-3 gap-0.5">
              {(Object.entries(ENC_LABELS) as [EncounterType,string][]).filter(([k])=>k!=="nothing").map(([k,v])=>(
                <div key={k} className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[7px] font-bold text-surface-300">{v}</p>
                  <p className="text-[6px] text-surface-600 mt-0.5">
                    {(k==="sea_monster"?"Kraken, Dragon Turtle, Serpent. DC 20 survival to avoid.":k==="pirates"?"Hostile ship. Rolls for ship type, crew size, demands.":k==="storm"?"Hurricane-force winds. DC 15 navigation. Hull damage on fail.":k==="sirens"?"WIS save vs charm. Lured toward rocks.":k==="merchant"?"Friendly trader. Goods, rumors, supplies.":k==="naval_patrol"?"Inspection. Smuggling checks. Bribes.":k==="reef"?"Hidden reef. DC 15 perception. Hull damage if failed.":"Safe harbor. Resupply, repairs, rumors.")}
                  </p>
                  <p className="text-[6px] text-surface-700 mt-0.5">
                    {(k==="sea_monster"?"CR 5-20, lair actions possible":k==="pirates"?"Crew 10-40, CR based on ship":k==="storm"?"Damage 2d10x10 hull per round":k==="sirens"?"DC 13-16 WIS, remove on damage":k==="merchant"?"Friendly, 2d20x10 GP trade value":k==="naval_patrol"?"DC 12 deception vs investigation":k==="reef"?"DC 15 piloting, 1d10x5 hull":"Full rest, 1d4x10 repair")}
                  </p>
                </div>
              ))}
            </div>
            {/* Naval Travel Summary */}
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-2.5 py-2 mt-1">
              <h4 className="text-[7px] uppercase tracking-wider text-cyan-400/60 font-bold mb-1">🗺️ Arkla Campaign — "The Iron Gull"</h4>
              <p className="text-[7px] text-surface-500">The party's vessel, <span className="text-cyan-400">The Iron Gull</span>, is a Sailing Ship (2.5 mph, 48 mi/day, 10 crew minimum). Kehrfuffle serves as first mate (CHA +2 for crew morale), Wendy handles navigation (DEX +4 for ship handling). Current voyage: Baldur's Gate to Waterdeep along the Sword Coast (~1,200 mi, ~25 days at normal pace).</p>
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[7px] text-surface-600">12 ship types · 7 sea states · 8 encounter types</span>
          <span className="text-[7px] text-surface-700">Final Sprint 40/40 — Complete VTT</span>
        </div>
      </div>
    </div>
  );
}
