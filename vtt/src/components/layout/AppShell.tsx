/**
 * STᚱ VTT — App Shell (Premium Persistent Layout)
 *
 * Master layout shell with h-screen w-screen overflow-hidden flex.
 *
 * Architecture:
 *   Desktop (lg+):
 *     [ Sidebar (persistent) | Main Content Area ]
 *     Sidebar is ALWAYS visible — never disappears.
 *     Transitions between w-64 (full) and w-16 (collapsed icon-only).
 *     Hamburger triggers collapse/expand, NOT hide/show.
 *
 *   Mobile (< lg):
 *     [ Main Content Area (full width) ]
 *     Sidebar is a sliding overlay triggered by hamburger.
 *     MobileBottomNav provides persistent bottom navigation.
 *
 * Fixed padding via inline to avoid Tailwind v4 JIT scanning issues.
 * Atmospheric depth ring and particle overlay for premium feel.
 */

import { useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import ToastContainer from "@/components/ui/ToastContainer";
import DmQuickReferenceOverlay from "@/components/ui/DmQuickReferenceOverlay";
import DmPartyRestOverlay from "@/components/control-center/DmPartyRestOverlay";
import DmCombatConditionBar from "@/components/control-center/DmCombatConditionBar";
import DmQuickActionPopover from "@/components/control-center/DmQuickActionPopover";
import DmNpcQuickCreatePopover from "@/components/control-center/DmNpcQuickCreatePopover";
import DmCombatWrapUpOverlay from "@/components/control-center/DmCombatWrapUpOverlay";
import DmSkillCheckPopover from "@/components/control-center/DmSkillCheckPopover";
import DmSocialInteractionPopover from "@/components/control-center/DmSocialInteractionPopover";
import DmTreasureGeneratorPopover from "@/components/control-center/DmTreasureGeneratorPopover";
import DmConcentrationTimerPopover from "@/components/control-center/DmConcentrationTimerPopover";
import DmLegendaryActionTracker from "@/components/control-center/DmLegendaryActionTracker";
import DmSpellReferencePopover from "@/components/control-center/DmSpellReferencePopover";
import DmWildShapeTracker from "@/components/control-center/DmWildShapeTracker";
import DmDowntimeTracker from "@/components/control-center/DmDowntimeTracker";
import DmTravelPaceGuide from "@/components/control-center/DmTravelPaceGuide";
import DmShipCombatGuide from "@/components/control-center/DmShipCombatGuide";
import GlobalQuickNote from "@/components/ui/GlobalQuickNote";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const showQuickRef = useUIStore((s) => s.showQuickRef);
  const toggleQuickRef = useUIStore((s) => s.toggleQuickRef);
  const setQuickRef = useUIStore((s) => s.setQuickRef);
  const showPartyRest = useUIStore((s) => s.showPartyRest);
  const setPartyRest = useUIStore((s) => s.setPartyRest);
  const showCombatConditions = useUIStore((s) => s.showCombatConditions);
  const setCombatConditions = useUIStore((s) => s.setCombatConditions);
  const showQuickActions = useUIStore((s) => s.showQuickActions);
  const setQuickActions = useUIStore((s) => s.setQuickActions);
  const showNpcQuickCreate = useUIStore((s) => s.showNpcQuickCreate);
  const setNpcQuickCreate = useUIStore((s) => s.setNpcQuickCreate);
  const showCombatWrapUp = useUIStore((s) => s.showCombatWrapUp);
  const setCombatWrapUp = useUIStore((s) => s.setCombatWrapUp);
  const showSkillCheck = useUIStore((s) => s.showSkillCheck);
  const setSkillCheck = useUIStore((s) => s.setSkillCheck);
  const showSocialInteraction = useUIStore((s) => s.showSocialInteraction);
  const setSocialInteraction = useUIStore((s) => s.setSocialInteraction);
  const showTreasureGenerator = useUIStore((s) => s.showTreasureGenerator);
  const setTreasureGenerator = useUIStore((s) => s.setTreasureGenerator);
  const showConcentrationTimer = useUIStore((s) => s.showConcentrationTimer);
  const setConcentrationTimer = useUIStore((s) => s.setConcentrationTimer);
  const showLegendaryTracker = useUIStore((s) => s.showLegendaryTracker);
  const setLegendaryTracker = useUIStore((s) => s.setLegendaryTracker);
  const showSpellReference = useUIStore((s) => s.showSpellReference);
  const setSpellReference = useUIStore((s) => s.setSpellReference);
  const showWildShapeTracker = useUIStore((s) => s.showWildShapeTracker);
  const setWildShapeTracker = useUIStore((s) => s.setWildShapeTracker);
  const showDowntimeTracker = useUIStore((s) => s.showDowntimeTracker);
  const setDowntimeTracker = useUIStore((s) => s.setDowntimeTracker);
  const showTravelPace = useUIStore((s) => s.showTravelPace);
  const setTravelPace = useUIStore((s) => s.setTravelPace);
  const showShipCombat = useUIStore((s) => s.showShipCombat);
  const setShipCombat = useUIStore((s) => s.setShipCombat);
  const role = useAuthStore((s) => s.role);

  // ── Ref-based handlers for stale-closure safety ──
  // Each handler stores the latest closure-safe toggle function
  // and the current toggle state, so the event listener always
  // reads the LATEST values without needing re-subscription.

  const toggleQuickRefRef = useRef(toggleQuickRef);
  toggleQuickRefRef.current = toggleQuickRef;

  useEffect(() => {
    const handler = () => { toggleQuickRefRef.current(); };
    window.addEventListener("toggle-dm-quickref", handler);
    return () => window.removeEventListener("toggle-dm-quickref", handler);
  }, []);

  const showPartyRestRef = useRef(showPartyRest);
  showPartyRestRef.current = showPartyRest;
  const setPartyRestRef = useRef(setPartyRest);
  setPartyRestRef.current = setPartyRest;

  useEffect(() => {
    const handler = () => { setPartyRestRef.current(!showPartyRestRef.current); };
    window.addEventListener("toggle-dm-party-rest", handler);
    return () => window.removeEventListener("toggle-dm-party-rest", handler);
  }, []);

  const showCombatConditionsRef = useRef(showCombatConditions);
  showCombatConditionsRef.current = showCombatConditions;
  const setCombatConditionsRef = useRef(setCombatConditions);
  setCombatConditionsRef.current = setCombatConditions;

  useEffect(() => {
    const handler = () => { setCombatConditionsRef.current(!showCombatConditionsRef.current); };
    window.addEventListener("toggle-dm-combat-conditions", handler);
    return () => window.removeEventListener("toggle-dm-combat-conditions", handler);
  }, []);

  const showQuickActionsRef = useRef(showQuickActions);
  showQuickActionsRef.current = showQuickActions;
  const setQuickActionsRef = useRef(setQuickActions);
  setQuickActionsRef.current = setQuickActions;

  useEffect(() => {
    const handler = () => { setQuickActionsRef.current(!showQuickActionsRef.current); };
    window.addEventListener("toggle-dm-quick-actions", handler);
    return () => window.removeEventListener("toggle-dm-quick-actions", handler);
  }, []);

  const showNpcQuickCreateRef = useRef(showNpcQuickCreate);
  showNpcQuickCreateRef.current = showNpcQuickCreate;
  const setNpcQuickCreateRef = useRef(setNpcQuickCreate);
  setNpcQuickCreateRef.current = setNpcQuickCreate;

  useEffect(() => {
    const handler = () => { setNpcQuickCreateRef.current(!showNpcQuickCreateRef.current); };
    window.addEventListener("toggle-dm-npc-quick-create", handler);
    return () => window.removeEventListener("toggle-dm-npc-quick-create", handler);
  }, []);

  const showCombatWrapUpRef = useRef(showCombatWrapUp);
  showCombatWrapUpRef.current = showCombatWrapUp;
  const setCombatWrapUpRef = useRef(setCombatWrapUp);
  setCombatWrapUpRef.current = setCombatWrapUp;

  useEffect(() => {
    const handler = () => { setCombatWrapUpRef.current(!showCombatWrapUpRef.current); };
    window.addEventListener("toggle-dm-combat-wrapup", handler);
    return () => window.removeEventListener("toggle-dm-combat-wrapup", handler);
  }, []);

  const showSkillCheckRef = useRef(showSkillCheck);
  showSkillCheckRef.current = showSkillCheck;
  const setSkillCheckRef = useRef(setSkillCheck);
  setSkillCheckRef.current = setSkillCheck;

  useEffect(() => {
    const handler = () => { setSkillCheckRef.current(!showSkillCheckRef.current); };
    window.addEventListener("toggle-dm-skill-check", handler);
    return () => window.removeEventListener("toggle-dm-skill-check", handler);
  }, []);

  const showSocialInteractionRef = useRef(showSocialInteraction);
  showSocialInteractionRef.current = showSocialInteraction;
  const setSocialInteractionRef = useRef(setSocialInteraction);
  setSocialInteractionRef.current = setSocialInteraction;

  useEffect(() => {
    const handler = () => { setSocialInteractionRef.current(!showSocialInteractionRef.current); };
    window.addEventListener("toggle-dm-social-interaction", handler);
    return () => window.removeEventListener("toggle-dm-social-interaction", handler);
  }, []);

  const showTreasureGeneratorRef = useRef(showTreasureGenerator);
  showTreasureGeneratorRef.current = showTreasureGenerator;
  const setTreasureGeneratorRef = useRef(setTreasureGenerator);
  setTreasureGeneratorRef.current = setTreasureGenerator;

  useEffect(() => {
    const handler = () => { setTreasureGeneratorRef.current(!showTreasureGeneratorRef.current); };
    window.addEventListener("toggle-dm-treasure-generator", handler);
    return () => window.removeEventListener("toggle-dm-treasure-generator", handler);
  }, []);

  const showConcentrationTimerRef = useRef(showConcentrationTimer);
  showConcentrationTimerRef.current = showConcentrationTimer;
  const setConcentrationTimerRef = useRef(setConcentrationTimer);
  setConcentrationTimerRef.current = setConcentrationTimer;

  useEffect(() => {
    const handler = () => { setConcentrationTimerRef.current(!showConcentrationTimerRef.current); };
    window.addEventListener("toggle-dm-concentration-timer", handler);
    return () => window.removeEventListener("toggle-dm-concentration-timer", handler);
  }, []);

  const showLegendaryTrackerRef = useRef(showLegendaryTracker);
  showLegendaryTrackerRef.current = showLegendaryTracker;
  const setLegendaryTrackerRef = useRef(setLegendaryTracker);
  setLegendaryTrackerRef.current = setLegendaryTracker;

  useEffect(() => {
    const handler = () => { setLegendaryTrackerRef.current(!showLegendaryTrackerRef.current); };
    window.addEventListener("toggle-dm-legendary-tracker", handler);
    return () => window.removeEventListener("toggle-dm-legendary-tracker", handler);
  }, []);

  const showSpellReferenceRef = useRef(showSpellReference);
  showSpellReferenceRef.current = showSpellReference;
  const setSpellReferenceRef = useRef(setSpellReference);
  setSpellReferenceRef.current = setSpellReference;

  useEffect(() => {
    const handler = () => { setSpellReferenceRef.current(!showSpellReferenceRef.current); };
    window.addEventListener("toggle-dm-spell-reference", handler);
    return () => window.removeEventListener("toggle-dm-spell-reference", handler);
  }, []);

  const showWildShapeTrackerRef = useRef(showWildShapeTracker);
  showWildShapeTrackerRef.current = showWildShapeTracker;
  const setWildShapeTrackerRef = useRef(setWildShapeTracker);
  setWildShapeTrackerRef.current = setWildShapeTracker;

  useEffect(() => {
    const handler = () => { setWildShapeTrackerRef.current(!showWildShapeTrackerRef.current); };
    window.addEventListener("toggle-dm-wild-shape", handler);
    return () => window.removeEventListener("toggle-dm-wild-shape", handler);
  }, []);

  const showDowntimeTrackerRef = useRef(showDowntimeTracker);
  showDowntimeTrackerRef.current = showDowntimeTracker;
  const setDowntimeTrackerRef = useRef(setDowntimeTracker);
  setDowntimeTrackerRef.current = setDowntimeTracker;

  useEffect(() => {
    const handler = () => { setDowntimeTrackerRef.current(!showDowntimeTrackerRef.current); };
    window.addEventListener("toggle-dm-downtime", handler);
    return () => window.removeEventListener("toggle-dm-downtime", handler);
  }, []);

  const showTravelPaceRef = useRef(showTravelPace);
  showTravelPaceRef.current = showTravelPace;
  const setTravelPaceRef = useRef(setTravelPace);
  setTravelPaceRef.current = setTravelPace;

  useEffect(() => {
    const handler = () => { setTravelPaceRef.current(!showTravelPaceRef.current); };
    window.addEventListener("toggle-dm-travel-pace", handler);
    return () => window.removeEventListener("toggle-dm-travel-pace", handler);
  }, []);

  const showShipCombatRef = useRef(showShipCombat);
  showShipCombatRef.current = showShipCombat;
  const setShipCombatRef = useRef(setShipCombat);
  setShipCombatRef.current = setShipCombat;

  useEffect(() => {
    const handler = () => { setShipCombatRef.current(!showShipCombatRef.current); };
    window.addEventListener("toggle-dm-ship-combat", handler);
    return () => window.removeEventListener("toggle-dm-ship-combat", handler);
  }, []);

  // ── Keyboard shortcut: ? key to toggle ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+/ on most keyboards
      if (e.key === "/" && e.shiftKey && !e.repeat) {
        // Don't trigger if in an input/textarea
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;
        e.preventDefault();
        toggleQuickRef();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleQuickRef]);

  return (
    <div className="overflow-hidden flex bg-obsidian-radial"
      style={{ height: '100dvh', width: '100dvw' }}
    >
      {/* Atmospheric depth ring */}
      <div className="depth-ring fixed inset-0 pointer-events-none z-0" />

      {/* ── SIDEBAR ──
          Desktop: persistent side-rail, always visible
          Mobile: drawer overlay handled by Sidebar component */}
      <div className="shrink-0 min-w-0">
        <Sidebar />
      </div>

      {/* ── MAIN CONTENT ──
          Flex-grow with min-h-0 to prevent overflow collapse.
          No conditional margins — sidebar handles its own width via flex shrink-0 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-gold">
          <div className="h-full" style={{ padding: "1.5rem 1.5rem max(5rem, env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation — only visible on < lg screens */}
      <MobileBottomNav />
      <ToastContainer />

      {/* ── DM Quick Reference Overlay ── */}
      <DmQuickReferenceOverlay
        isOpen={showQuickRef}
        onClose={() => setQuickRef(false)}
      />

      {/* ── DM Party Rest Overlay ──
          Globally accessible — open from sidebar or keyboard shortcut */}
      {role === "dm" && (
        <DmPartyRestOverlay
          isOpen={showPartyRest}
          onClose={() => setPartyRest(false)}
        />
      )}

      {/* ── DM Combat Condition Bar ──
          Globally accessible — apply conditions to characters/combatants
          from ANY page during fast-paced combat */}
      {role === "dm" && (
        <DmCombatConditionBar
          isOpen={showCombatConditions}
          onClose={() => setCombatConditions(false)}
        />
      )}

      {/* ── DM Quick Action Popover ──
          Globally accessible — damage, heal, temp HP & gold distribution
          from ANY page without navigating to Player Cards */}
      {role === "dm" && (
        <DmQuickActionPopover
          isOpen={showQuickActions}
          onClose={() => setQuickActions(false)}
        />
      )}

      {/* ── DM NPC Quick Create Popover ──
          Build a monster statblock and instantly add to combat
          from ANY page — no navigation to Bestiary needed */}
      {role === "dm" && (
        <DmNpcQuickCreatePopover
          isOpen={showNpcQuickCreate}
          onClose={() => setNpcQuickCreate(false)}
        />
      )}

      {/* ── DM Combat Wrap-Up Overlay ──
          Encounter resolution: XP awards, loot distribution, condition clearing,
          combat stats summary — all in one place after combat ends */}
      {role === "dm" && (
        <DmCombatWrapUpOverlay
          isOpen={showCombatWrapUp}
          onClose={() => setCombatWrapUp(false)}
        />
      )}

      {/* ── DM Skill Check & Passive Awareness Popover (Sprint 31) ──
          Call skill/ability checks, track advantage/disadvantage,
          view party passive perception/investigation/insight */}
      {role === "dm" && (
        <DmSkillCheckPopover />
      )}

      {/* ── DM Social Interaction & Monster Knowledge Popover (Sprint 32) ──
          DMG social encounter rules (attitude, DC shifts, reaction rolls)
          + monster knowledge checks (Arcana/Nature/Religion lore) */}
      {role === "dm" && (
        <DmSocialInteractionPopover />
      )}

      {/* ── DM Treasure & Loot Generator Popover (Sprint 33) ──
          DMG treasure tables for individual parcels and hoards
          with magic items, art, and gems per CR tier */}
      {role === "dm" && (
        <DmTreasureGeneratorPopover />
      )}

      {/* ── DM Concentration Duration Timer Popover (Sprint 34) ──
          Real-time countdown for active concentration spells
          with configurable durations and expiry warnings */}
      {role === "dm" && (
        <DmConcentrationTimerPopover />
      )}

      {/* ── DM Legendary Action Tracker Popover (Sprint 35) ──
          Track legendary actions (3/round), resistances, lair actions,
          mythic phases, and recharge abilities per creature */}
      {role === "dm" && (
        <DmLegendaryActionTracker />
      )}

      {/* ── DM Spell Reference Popover (Sprint 36) ──
          In-game spell rules reference. Searches SRD + homebrew spells.
          Filter by level, school, class. Full 5e statblock details. */}
      {role === "dm" && (
        <DmSpellReferencePopover />
      )}

      {role === "dm" && (
        <DmWildShapeTracker />
      )}

      {role === "dm" && (
        <DmDowntimeTracker />
      )}

      {role === "dm" && (
        <DmTravelPaceGuide />
      )}

      {role === "dm" && (
        <DmShipCombatGuide />
      )}

      {/* ── GLOBAL QUICK NOTE ──
          Available from ANY page for BOTH DM and Player roles.
          Floating FAB (bottom-right) for jotting ideas, quest details,
          or combat notes without navigating to the Journal page.
          Saves directly to campaign journal. */}
      <GlobalQuickNote />
    </div>
  );
}
