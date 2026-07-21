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
import PartyInventoryPanel from "@/components/player/PartyInventoryPanel";
import DmCombatProgressPanel from "@/components/control-center/DmCombatProgressPanel";
import DmDamageCalculator from "@/components/control-center/DmDamageCalculator";
import DmInitiativeDraft from "@/components/control-center/DmInitiativeDraft";
import DmCombatantMover from "@/components/control-center/DmCombatantMover";
import DmPartyResourcesQuickView from "@/components/control-center/DmPartyResourcesQuickView";
import DmEncounterAnalyzer from "@/components/control-center/DmEncounterAnalyzer";
import DmQuestTracker from "@/components/control-center/DmQuestTracker";
import DmTimeTracker from "@/components/control-center/DmTimeTracker";
import DmSessionRecap from "@/components/control-center/DmSessionRecap";
import DmFactionTracker from "@/components/control-center/DmFactionTracker";
import PartySpellSlotsPanel from "@/components/player/PartySpellSlotsPanel";
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
  const showPartyInventory = useUIStore((s) => s.showPartyInventory);
  const setPartyInventory = useUIStore((s) => s.setPartyInventory);
  const showPartySpellSlots = useUIStore((s) => s.showPartySpellSlots);
  const setPartySpellSlots = useUIStore((s) => s.setPartySpellSlots);
  const showCombatProgress = useUIStore((s) => s.showCombatProgress);
  const setCombatProgress = useUIStore((s) => s.setCombatProgress);
  const showDamageCalculator = useUIStore((s) => s.showDamageCalculator);
  const setDamageCalculator = useUIStore((s) => s.setDamageCalculator);
  const showInitiativeDraft = useUIStore((s) => s.showInitiativeDraft);
  const setInitiativeDraft = useUIStore((s) => s.setInitiativeDraft);
  const showCombatantMover = useUIStore((s) => s.showCombatantMover);
  const setCombatantMover = useUIStore((s) => s.setCombatantMover);
  const showPartyResources = useUIStore((s) => s.showPartyResources);
  const setPartyResources = useUIStore((s) => s.setPartyResources);
  const showEncounterAnalyzer = useUIStore((s) => s.showEncounterAnalyzer);
  const setEncounterAnalyzer = useUIStore((s) => s.setEncounterAnalyzer);
  const showQuestTracker = useUIStore((s) => s.showQuestTracker);
  const setQuestTracker = useUIStore((s) => s.setQuestTracker);
  const showTimeTracker = useUIStore((s) => s.showTimeTracker);
  const setTimeTracker = useUIStore((s) => s.setTimeTracker);
  const showSessionRecap = useUIStore((s) => s.showSessionRecap);
  const setSessionRecap = useUIStore((s) => s.setSessionRecap);
  const showFactionTracker = useUIStore((s) => s.showFactionTracker);
  const setFactionTracker = useUIStore((s) => s.setFactionTracker);
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

  const showCombatProgressRef = useRef(showCombatProgress);
  showCombatProgressRef.current = showCombatProgress;
  const setCombatProgressRef = useRef(setCombatProgress);
  setCombatProgressRef.current = setCombatProgress;

  const showDamageCalculatorRef = useRef(showDamageCalculator);
  showDamageCalculatorRef.current = showDamageCalculator;
  const setDamageCalculatorRef = useRef(setDamageCalculator);
  setDamageCalculatorRef.current = setDamageCalculator;

  useEffect(() => {
    const handler = () => { setShipCombatRef.current(!showShipCombatRef.current); };
    window.addEventListener("toggle-dm-ship-combat", handler);
    return () => window.removeEventListener("toggle-dm-ship-combat", handler);
  }, []);

  useEffect(() => {
    const handler = () => { setCombatProgressRef.current(!showCombatProgressRef.current); };
    window.addEventListener("toggle-dm-combat-progress", handler);
    return () => window.removeEventListener("toggle-dm-combat-progress", handler);
  }, []);

  useEffect(() => {
    const handler = () => { setDamageCalculatorRef.current(!showDamageCalculatorRef.current); };
    window.addEventListener("toggle-dm-damage-calculator", handler);
    return () => window.removeEventListener("toggle-dm-damage-calculator", handler);
  }, []);

  const showInitiativeDraftRef = useRef(showInitiativeDraft);
  showInitiativeDraftRef.current = showInitiativeDraft;
  const setInitiativeDraftRef = useRef(setInitiativeDraft);
  setInitiativeDraftRef.current = setInitiativeDraft;

  useEffect(() => {
    const handler = () => { setInitiativeDraftRef.current(!showInitiativeDraftRef.current); };
    window.addEventListener("toggle-dm-initiative-draft", handler);
    return () => window.removeEventListener("toggle-dm-initiative-draft", handler);
  }, []);

  const showCombatantMoverRef = useRef(showCombatantMover);
  showCombatantMoverRef.current = showCombatantMover;
  const setCombatantMoverRef = useRef(setCombatantMover);
  setCombatantMoverRef.current = setCombatantMover;

  useEffect(() => {
    const handler = () => { setCombatantMoverRef.current(!showCombatantMoverRef.current); };
    window.addEventListener("toggle-dm-combatant-mover", handler);
    return () => window.removeEventListener("toggle-dm-combatant-mover", handler);
  }, []);

  const showPartyResourcesRef = useRef(showPartyResources);
  showPartyResourcesRef.current = showPartyResources;
  const setPartyResourcesRef = useRef(setPartyResources);
  setPartyResourcesRef.current = setPartyResources;

  useEffect(() => {
    const handler = () => { setPartyResourcesRef.current(!showPartyResourcesRef.current); };
    window.addEventListener("toggle-dm-party-resources", handler);
    return () => window.removeEventListener("toggle-dm-party-resources", handler);
  }, []);

  const showEncounterAnalyzerRef = useRef(showEncounterAnalyzer);
  showEncounterAnalyzerRef.current = showEncounterAnalyzer;
  const setEncounterAnalyzerRef = useRef(setEncounterAnalyzer);
  setEncounterAnalyzerRef.current = setEncounterAnalyzer;

  useEffect(() => {
    const handler = () => { setEncounterAnalyzerRef.current(!showEncounterAnalyzerRef.current); };
    window.addEventListener("toggle-dm-encounter-analyzer", handler);
    return () => window.removeEventListener("toggle-dm-encounter-analyzer", handler);
  }, []);

  const showQuestTrackerRef = useRef(showQuestTracker);
  showQuestTrackerRef.current = showQuestTracker;
  const setQuestTrackerRef = useRef(setQuestTracker);
  setQuestTrackerRef.current = setQuestTracker;

  useEffect(() => {
    const handler = () => { setQuestTrackerRef.current(!showQuestTrackerRef.current); };
    window.addEventListener("toggle-dm-quest-tracker", handler);
    return () => window.removeEventListener("toggle-dm-quest-tracker", handler);
  }, []);

  const showTimeTrackerRef = useRef(showTimeTracker);
  showTimeTrackerRef.current = showTimeTracker;
  const setTimeTrackerRef = useRef(setTimeTracker);
  setTimeTrackerRef.current = setTimeTracker;

  useEffect(() => {
    const handler = () => { setTimeTrackerRef.current(!showTimeTrackerRef.current); };
    window.addEventListener("toggle-dm-time-tracker", handler);
    return () => window.removeEventListener("toggle-dm-time-tracker", handler);
  }, []);

  const showSessionRecapRef = useRef(showSessionRecap);
  showSessionRecapRef.current = showSessionRecap;
  const setSessionRecapRef = useRef(setSessionRecap);
  setSessionRecapRef.current = setSessionRecap;

  useEffect(() => {
    const handler = () => { setSessionRecapRef.current(!showSessionRecapRef.current); };
    window.addEventListener("toggle-dm-session-recap", handler);
    return () => window.removeEventListener("toggle-dm-session-recap", handler);
  }, []);

  const showFactionTrackerRef = useRef(showFactionTracker);
  showFactionTrackerRef.current = showFactionTracker;
  const setFactionTrackerRef = useRef(setFactionTracker);
  setFactionTrackerRef.current = setFactionTracker;

  useEffect(() => {
    const handler = () => { setFactionTrackerRef.current(!showFactionTrackerRef.current); };
    window.addEventListener("toggle-dm-faction-tracker", handler);
    return () => window.removeEventListener("toggle-dm-faction-tracker", handler);
  }, []);

  const showPartyInventoryRef = useRef(showPartyInventory);
  showPartyInventoryRef.current = showPartyInventory;
  const setPartyInventoryRef = useRef(setPartyInventory);
  setPartyInventoryRef.current = setPartyInventory;

  useEffect(() => {
    const handler = () => { setPartyInventoryRef.current(!showPartyInventoryRef.current); };
    window.addEventListener("toggle-dm-party-inventory", handler);
    return () => window.removeEventListener("toggle-dm-party-inventory", handler);
  }, []);

  const showPartySpellSlotsRef = useRef(showPartySpellSlots);
  showPartySpellSlotsRef.current = showPartySpellSlots;
  const setPartySpellSlotsRef = useRef(setPartySpellSlots);
  setPartySpellSlotsRef.current = setPartySpellSlots;

  useEffect(() => {
    const handler = () => { setPartySpellSlotsRef.current(!showPartySpellSlotsRef.current); };
    window.addEventListener("toggle-dm-party-spell-slots", handler);
    return () => window.removeEventListener("toggle-dm-party-spell-slots", handler);
  }, []);

  // ── Quick Note custom event: sidebar button / programmatic ──
  useEffect(() => {
    // Toggle open/close via a shared ref to avoid stale state
    let quickNoteOpen = false;
    const handler = () => {
      quickNoteOpen = !quickNoteOpen;
      window.dispatchEvent(
        new CustomEvent("global-quicknote-toggle", { detail: { open: quickNoteOpen } })
      );
    };
    window.addEventListener("toggle-dm-quicknote", handler);
    return () => window.removeEventListener("toggle-dm-quicknote", handler);
  }, []);

  // ── Keyboard shortcut:  Ctrl+N / Cmd+N to open Quick Note ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.repeat) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-dm-quicknote"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Keyboard shortcut: ? key to toggle Quick Reference ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+/ on most keyboards
      if (e.key === "/" && e.shiftKey && !e.repeat) {
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

      {/* ── DM Combat Progress Panel (Cycle 26) ──
          Full encounter status dashboard with HP bars, turn order,
          damage/healing totals, turn timer, and quick controls. */}
      {role === "dm" && (
        <DmCombatProgressPanel onClose={() => setCombatProgress(false)} />
      )}

      {/* ── DM Damage/Healing Calculator (Cycle 27) ──
          Quick damage/healing resolution for environmental effects,
          traps, fall damage, poison, and other non-attack sources.
          Presets per CR tier, 13 damage types, multi-target, resistance. */}
      {role === "dm" && (
        <DmDamageCalculator onClose={() => setDamageCalculator(false)} />
      )}

      {/* ── DM Initiative Quick-Draft (Cycle 28) ──
          Rapid initiative entry for combat setup. Auto-fills PCs,
          quick +/- buttons for DEX bonuses, enemy typeahead,
          sort, lock, and one-click commit/start combat. */}
      {role === "dm" && (
        <DmInitiativeDraft onClose={() => setInitiativeDraft(false)} />
      )}

      {/* ── DM Combatant Mover (Cycle 29) ──
          Quick-reposition combatant tokens from any page. Teleport,
          drop pins, waypoint history, and coordinate input without
          navigating to the battle map. Reads combatants from active
          encounter. */}
      {role === "dm" && (
        <DmCombatantMover onClose={() => setCombatantMover(false)} />
      )}

      {/* ── DM Party Resources Quick-View (Cycle 30) ──
          At-a-glance resource overview for ALL player characters:
          spell slots, class resources, hit dice, concentration,
          and conditions without opening individual sheets. */}
      {role === "dm" && (
        <DmPartyResourcesQuickView onClose={() => setPartyResources(false)} />
      )}

      {/* ── DM Encounter Analyzer (Cycle 31) ──
          Analyzes the current encounter against the party's actual
          capabilities. Shows difficulty breakdown, save targeting
          warnings, action economy analysis, and recommendations
          for encounter adjustment based on 5.5e RAW. */}
      {role === "dm" && (
        <DmEncounterAnalyzer onClose={() => setEncounterAnalyzer(false)} />
      )}

      {/* ── DM Quest Tracker (Cycle 32) ──
          Session-side reference for active quests, named NPCs with
          attitudes, and key campaign locations. Inline editable,
          searchable across all 3 categories, color-coded statuses. */}
      {role === "dm" && (
        <DmQuestTracker onClose={() => setQuestTracker(false)} />
      )}

      {/* ── DM Time & Calendar Tracker (Cycle 33) ──
          In-game time management: calendar dates, time of day,
          speed-controlled clock, event timers with countdowns.
          Helps DMs track spell durations, rest timing, and
          ticking time-based events. */}
      {role === "dm" && (
        <DmTimeTracker onClose={() => setTimeTracker(false)} />
      )}

      {/* ── DM Session Recap (Cycle 34) ──
          Auto-generates structured session summaries from combat
          activity, XP awards, journal entries, and condition tracking.
          Saves formatted recaps directly to the campaign journal. */}
      {role === "dm" && (
        <DmSessionRecap onClose={() => setSessionRecap(false)} />
      )}

      {/* ── DM Faction Tracker (Cycle 35 — FINAL) ──
          Track NPC factions, inter-faction relations, party attitudes,
          influence scores, and key NPC members. State persisted in localStorage. */}
      {role === "dm" && (
        <DmFactionTracker onClose={() => setFactionTracker(false)} />
      )}

      {/* ── DM Party Inventory Panel (Cycle 21) ──
          Unified view of ALL characters' inventories in one panel.
          Search items, see party wealth, drag items between characters. */}
      {role === "dm" && (
        <PartyInventoryPanel />
      )}

      {/* ── DM Party Spell Slots Panel (Cycle 23) ──
          View ALL party members' spell slot usage at a glance.
          See who has slots remaining, concentration status,
          and quick-restore slots per character. */}
      {role === "dm" && (
        <PartySpellSlotsPanel />
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
