/**
 * STᚱ VTT — Sidebar (Premium Persistent Side-Rail)
 *
 * Desktop: ALWAYS visible as a persistent side-rail.
 * - sidebarOpen = true  → w-64 full-width (labels visible)
 * - sidebarOpen = false → w-16 collapsed (icons only)
 * - The sidebar NEVER fully disappears on desktop.
 *
 * Mobile: acts as a drawer overlay triggered by the hamburger.
 * - sidebarOpen = true  → overlay slides in from left with backdrop
 * - sidebarOpen = false → hidden off-screen
 * - MobileBottomNav provides persistent bottom navigation
 *
 * CRITICAL ARCHITECTURE: All navigation links AND DM tools live
 * inside the SAME scrollable <nav> container. This ensures that
 * in collapsed mode (w-16), all items scroll together without
 * overlapping, and the main nav links are always visible first.
 *
 * Architecture:
 *   - Responsive breakpoint: lg (1024px)
 *   - Uses useResponsive for accurate breakpoint detection
 *   - Body scroll lock on mobile when sidebar is open
 *   - All sub-components are reusable (SidebarBrand, SidebarNavLink, SidebarFooter)
 */

import { useEffect, useCallback, useState } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { useUIStore } from "@/stores/uiStore";
import { useResponsive } from "@/hooks/useResponsive";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import SidebarBrand from "./SidebarBrand";
import SidebarNavLink from "./SidebarNavLink";
import SidebarFooter from "./SidebarFooter";
import SyncHealthPanel from "@/components/ui/SyncHealthPanel";
import ConnectedPlayersPanel from "@/components/ui/ConnectedPlayersPanel";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/campaign/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/campaign/player-cards", label: "Player Cards", icon: "👥" },
  { path: "/campaign/homebrew", label: "Homebrew", icon: "⚗" },
  { path: "/campaign/encounters", label: "Bestiary & Encounters", icon: "⚔" },
  { path: "/campaign/maps", label: "Battle Maps", icon: "🗺" },
  { path: "/campaign/journal", label: "Journal", icon: "📖" },
  // Asset Gallery removed — images are now accessible directly via PC portrait, map, and token pickers
  { path: "/campaign/settings", label: "Settings", icon: "⚙" },
];

/** Non-link utility buttons that blend into the nav list */
const navActions: { action: string; label: string; icon: string; eventName: string }[] = [];

import type { IconName } from "@/components/ui/PremiumIcon";

/** All DM tool actions as a data array to eliminate repetition */
interface DmToolProps {
  /** Custom event name to dispatch */
  eventName: string;
  /** PremiumIcon name */
  icon: IconName;
  /** Icon color class */
  colorClass: string;
  /** Hover accent color class */
  hoverClass: string;
  /** Label shown when sidebar is open */
  label: string;
  /** Title/tooltip */
  title: string;
}

const dmTools: DmToolProps[] = [
  {
    eventName: "toggle-dm-skill-check",
    icon: "rollInitiative",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-amber-500/8 hover:border-amber-500/10",
    label: "Skill Check",
    title: "Skill Check — Call party skill checks & view passive scores",
  },
  {
    eventName: "toggle-dm-treasure-generator",
    icon: "loot",
    colorClass: "text-amber-400",
    hoverClass: "hover:bg-amber-500/8 hover:border-amber-500/10",
    label: "Treasure",
    title: "Treasure & Loot Generator — DMG treasure tables for individual parcels & hoards",
  },
  {
    eventName: "toggle-dm-concentration-timer",
    icon: "sparkles",
    colorClass: "text-violet-400",
    hoverClass: "hover:bg-violet-500/8 hover:border-violet-500/10",
    label: "Concentration",
    title: "Concentration Timer — Real-time countdown for active concentration spells",
  },
  {
    eventName: "toggle-dm-legendary-tracker",
    icon: "attack",
    colorClass: "text-rose-400",
    hoverClass: "hover:bg-rose-500/8 hover:border-rose-500/10",
    label: "Legendary",
    title: "Legendary Actions — Track legendary actions, resistances, lair actions, mythic phases & recharges",
  },
  {
    eventName: "toggle-dm-spell-reference",
    icon: "sparkles",
    colorClass: "text-indigo-400",
    hoverClass: "hover:bg-indigo-500/8 hover:border-indigo-500/10",
    label: "Spell Reference",
    title: "Spell Reference — Search and browse all SRD and homebrew spells with full 5e statblock details",
  },
  {
    eventName: "toggle-dm-wild-shape",
    icon: "sparkles",
    colorClass: "text-emerald-400",
    hoverClass: "hover:bg-emerald-500/8 hover:border-emerald-500/10",
    label: "Wild Shape",
    title: "Wild Shape & Polymorph — Track transformed creature statblocks, shape HP, and auto-revert on KO",
  },
  {
    eventName: "toggle-dm-downtime",
    icon: "restRecovery",
    colorClass: "text-amber-400",
    hoverClass: "hover:bg-amber-500/8 hover:border-amber-500/10",
    label: "Rest & Downtime",
    title: "Rest & Downtime — Between-session activities: training, crafting, research, carousing, scribing, pit fighting, religious service, work, luxury rest, and copying spells",
  },
  {
    eventName: "toggle-dm-travel-pace",
    icon: "travel",
    colorClass: "text-sky-400",
    hoverClass: "hover:bg-sky-500/8 hover:border-sky-500/10",
    label: "Travel & Wilderness",
    title: "Travel & Wilderness — Overland travel, navigation, foraging, weather, and random encounters",
  },
  {
    eventName: "toggle-dm-initiative-draft",
    icon: "rollInitiative",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Init Draft",
    title: "Initiative Quick-Draft — Rapid initiative entry, sort, lock, and one-click commit to combat",
  },
  {
    eventName: "toggle-dm-combatant-mover",
    icon: "attack",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Combat Mover",
    title: "Combatant Mover — Quick-reposition tokens, drop pins, waypoint history, coordinate input",
  },
  {
    eventName: "toggle-dm-party-resources",
    icon: "hud",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Resources",
    title: "Party Resources — Spell slots, class resources, hit dice, conditions at a glance",
  },
  {
    eventName: "toggle-dm-encounter-analyzer",
    icon: "conditions",
    colorClass: "text-amber-400",
    hoverClass: "hover:bg-amber-500/8 hover:border-amber-500/10",
    label: "Analyzer",
    title: "Encounter Analyzer — Party balance, difficulty, save targeting, recommendations",
  },
  {
    eventName: "toggle-dm-quest-tracker",
    icon: "loot",
    colorClass: "text-emerald-400",
    hoverClass: "hover:bg-emerald-500/8 hover:border-emerald-500/10",
    label: "Quest Tracker",
    title: "Session Tracker — Active quests, named NPCs, key locations with inline editing",
  },
  {
    eventName: "toggle-dm-time-tracker",
    icon: "restRecovery",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Time & Calendar",
    title: "Time & Calendar — In-game clock, calendar dates, and event timers with countdowns",
  },
  {
    eventName: "toggle-dm-session-recap",
    icon: "encounterComplete",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Session Recap",
    title: "Session Recap — Auto-generate session summaries from combat, XP, and journal data",
  },
  {
    eventName: "toggle-dm-faction-tracker",
    icon: "encounterComplete",
    colorClass: "text-violet-400",
    hoverClass: "hover:bg-violet-500/8 hover:border-violet-500/10",
    label: "Factions",
    title: "Faction Tracker — Track NPC factions, inter-faction relations, party attitudes, influence, and key members",
  },
  {
    eventName: "toggle-dm-damage-calculator",
    icon: "attack",
    colorClass: "text-rose-400",
    hoverClass: "hover:bg-rose-500/8 hover:border-rose-500/10",
    label: "Damage Calc",
    title: "Damage/Healing Calculator — Quick resolve for traps, fall damage, environmental effects, poison, and healing",
  },
  {
    eventName: "toggle-dm-combat-progress",
    icon: "encounterComplete",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold-500/10",
    label: "Combat Progress",
    title: "Combat Progress Dashboard — Full encounter status, HP bars, turn timer, damage/healing totals",
  },
  {
    eventName: "toggle-dm-ship-combat",
    icon: "ship",
    colorClass: "text-cyan-400",
    hoverClass: "hover:bg-cyan-500/8 hover:border-cyan-500/10",
    label: "Naval & Ships",
    title: "Naval Combat & Travel — Ship stats, sea encounters, siege weapons, crew management",
  },
  {
    eventName: "toggle-dm-social-interaction",
    icon: "monsterKnowledge",
    colorClass: "text-violet-400",
    hoverClass: "hover:bg-violet-500/8 hover:border-violet-500/10",
    label: "Social & Knowledge",
    title: "Social Interaction & Monster Knowledge — DMG social rules + creature lore checks",
  },
  {
    eventName: "toggle-dm-combat-conditions",
    icon: "conditions",
    colorClass: "text-amber-400",
    hoverClass: "hover:bg-amber-500/8 hover:border-amber-500/10",
    label: "Conditions",
    title: "Combat Conditions — Apply/remove 5.5e conditions to any combatant",
  },
  {
    eventName: "toggle-dm-quick-actions",
    icon: "quickActions",
    colorClass: "text-rose-400",
    hoverClass: "hover:bg-rose-500/8 hover:border-rose-500/10",
    label: "Quick Actions",
    title: "Quick Actions — Damage, Heal, Temp HP, Gold distribution from any page",
  },
  {
    eventName: "toggle-dm-npc-quick-create",
    icon: "npcs",
    colorClass: "text-emerald-400",
    hoverClass: "hover:bg-emerald-500/8 hover:border-emerald-500/10",
    label: "NPC Quick Create",
    title: "NPC Quick Create — Build a monster & add to combat instantly",
  },
  {
    eventName: "toggle-dm-party-rest",
    icon: "restRecovery",
    colorClass: "text-emerald-400",
    hoverClass: "hover:bg-emerald-500/8 hover:border-emerald-500/10",
    label: "Party Rest",
    title: "Party Rest & Recovery — Apply short/long rest to all party members",
  },
  {
    eventName: "toggle-dm-combat-wrapup",
    icon: "encounterComplete",
    colorClass: "text-gold-400",
    hoverClass: "hover:bg-gold-500/8 hover:border-gold/10",
    label: "Combat Wrap-Up",
    title: "Combat Wrap-Up — XP, Loot, Condition Clearing",
  },
  {
    eventName: "toggle-dm-party-inventory",
    icon: "loot",
    colorClass: "text-cyan-400",
    hoverClass: "hover:bg-cyan-500/8 hover:border-cyan-500/10",
    label: "Party Inventory",
    title: "Party Inventory — View all characters' items, search, drag-and-drop transfer",
  },
  {
    eventName: "toggle-dm-party-spell-slots",
    icon: "sparkles",
    colorClass: "text-violet-400",
    hoverClass: "hover:bg-violet-500/8 hover:border-violet-500/10",
    label: "Party Spell Slots",
    title: "Party Spell Slots — See all casters' slot usage, DC/ATK, restore slots",
  },
];

/** Map of tool event name → hover text color class (Tailwind JIT-safe) */
const TOOL_HOVER_TEXT: Record<string, string> = {
  "toggle-dm-skill-check": "group-hover:text-gold-400",
  "toggle-dm-treasure-generator": "group-hover:text-amber-400",
  "toggle-dm-concentration-timer": "group-hover:text-violet-400",
  "toggle-dm-legendary-tracker": "group-hover:text-rose-400",
  "toggle-dm-spell-reference": "group-hover:text-indigo-400",
  "toggle-dm-wild-shape": "group-hover:text-emerald-400",
  "toggle-dm-downtime": "group-hover:text-amber-400",
  "toggle-dm-travel-pace": "group-hover:text-sky-400",
  "toggle-dm-ship-combat": "group-hover:text-cyan-400",
  "toggle-dm-social-interaction": "group-hover:text-violet-400",
  "toggle-dm-combat-conditions": "group-hover:text-amber-400",
  "toggle-dm-quick-actions": "group-hover:text-rose-400",
  "toggle-dm-npc-quick-create": "group-hover:text-emerald-400",
  "toggle-dm-party-rest": "group-hover:text-emerald-400",
  "toggle-dm-combatant-mover": "group-hover:text-gold-400",
  "toggle-dm-party-resources": "group-hover:text-gold-400",
  "toggle-dm-encounter-analyzer": "group-hover:text-amber-400",
  "toggle-dm-quest-tracker": "group-hover:text-emerald-400",
  "toggle-dm-time-tracker": "group-hover:text-gold-400",
  "toggle-dm-session-recap": "group-hover:text-gold-400",
  "toggle-dm-faction-tracker": "group-hover:text-violet-400",
  "toggle-dm-combat-wrapup": "group-hover:text-gold-400",
  "toggle-dm-party-inventory": "group-hover:text-cyan-400",
  "toggle-dm-party-spell-slots": "group-hover:text-violet-400",
  "toggle-dm-initiative-draft": "group-hover:text-gold-400",
  "toggle-dm-damage-calculator": "group-hover:text-rose-400",
  "toggle-dm-combat-progress": "group-hover:text-gold-400",
};

/** Renders a single DM tool button — reused for both expanded and collapsed modes */
function DmToolButton({ tool, isOpen }: { tool: DmToolProps; isOpen: boolean }) {
  const hoverTextClass = TOOL_HOVER_TEXT[tool.eventName] || "group-hover:text-surface-300";

  const iconContent = tool.icon ? (
    <PremiumIcon name={tool.icon} className={`w-3.5 h-3.5 ${tool.colorClass}`} />
  ) : (
    <span className="w-3.5 h-3.5 flex items-center justify-center text-[13px]">
      {tool.label === "Travel & Wilderness" ? "🗺️" : tool.label === "Naval & Ships" ? "⚓" : "💬"}
    </span>
  );

  return (
    <div className={`px-2 ${!isOpen ? "flex justify-center" : ""}`}>
      <button
        onClick={() => { window.dispatchEvent(new CustomEvent(tool.eventName)); }}
        className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 group ${tool.hoverClass} ${
          isOpen
            ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
            : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
        }`}
        title={tool.title}
        aria-label={tool.label}
      >
        {iconContent}
        {isOpen && (
          <span className={`text-[9px] text-surface-400 transition-colors truncate ${hoverTextClass}`}>
            {tool.label}
          </span>
        )}
      </button>
    </div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isMobile, isDesktop } = useResponsive();

  // ── DM Tools collapsible state (defaults to collapsed to prevent nav/tool overlap) ──
  const [toolsOpen, setToolsOpen] = useState(false);

  // ── Mobile body scroll lock (extracted hook) ──
  useBodyScrollLock(sidebarOpen && isMobile);

  // ── Desktop: sidebar is ALWAYS visible ──
  // If somehow sidebar got closed on desktop (nav bug), re-open it
  const ensureDesktopVisible = useCallback(() => {
    if (isDesktop && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [isDesktop, sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    ensureDesktopVisible();
  }, [ensureDesktopVisible]);

  // On desktop, always render — sidebar never disappears
  // On mobile, only render as overlay (shown/hidden by translate)
  return (
    <>
      {/* ── MOBILE OVERLAY BACKDROP ── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          // ── PERMANENT DESKTOP VISIBILITY ──
          // Desktop: sidebar ALWAYS renders, never disappears
          // It transitions between w-64 (open) and w-16 (collapsed)
          lg:relative lg:shrink-0 lg:translate-x-0 lg:flex
          ${
            isDesktop
              ? sidebarOpen
                ? "lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem]"
                : "lg:w-16 lg:min-w-[4rem] lg:max-w-[4rem]"
              : ""
          }

          // ── MOBILE OVERLAY ──
          ${
            isMobile
              ? sidebarOpen
                ? "translate-x-0 w-64 min-w-[16rem] max-w-[16rem]"
                : "-translate-x-full"
              : ""
          }

          // ── SHARED STYLING ──
          flex flex-col select-none
          bg-gradient-to-b from-[#14151f]/[0.95] to-[#0f101a]/[0.98]
          lg:bg-gradient-to-b from-[#14151f]/[0.88] to-[#0f101a]/[0.94]
          backdrop-blur-2xl border-r border-white/[0.06]
          shadow-[4px_0_32px_rgba(0,0,0,0.2)]
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          overflow-hidden
          ${isMobile ? "fixed top-0 left-0 z-50 h-full" : "h-full"}
        `}
      >
        {/* Gold edge light on right side */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent pointer-events-none" />

        {/* ── BRAND BAR ── */}
        <SidebarBrand isOpen={sidebarOpen} />

        {/* ── SCROLLABLE CONTENT ──
            ALL items (nav + tools + panels) live inside a single
            scrollable container. This prevents overflow overlap
            in collapsed mode and keeps the nav always accessible. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-gold py-3">

          {/* ── HAMBURGER TOGGLE (top of sidebar scroll) ── */}
          <div className="flex items-center px-3 pb-1.5">
            <button
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] active:scale-90 transition-all duration-200 group"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="flex flex-col items-center justify-center gap-[3px] w-4">
                <span className={`block w-4 h-[1.5px] bg-surface-500 rounded-full transition-all duration-300 ease-in-out origin-center ${
                  sidebarOpen ? "-rotate-45 translate-y-[2.25px]" : ""
                }`} />
                <span className={`block w-4 h-[1.5px] bg-surface-500 rounded-full transition-all duration-300 ease-in-out ${
                  sidebarOpen ? "opacity-0 scale-x-0" : ""
                }`} />
                <span className={`block w-4 h-[1.5px] bg-surface-500 rounded-full transition-all duration-300 ease-in-out origin-center ${
                  sidebarOpen ? "rotate-45 -translate-y-[2.25px]" : ""
                }`} />
              </div>
            </button>
            {sidebarOpen && (
              <span className="ml-2 text-[7px] uppercase tracking-[0.15em] font-bold text-gold-500/40">Collapse</span>
            )}
          </div>

          {/* ── NAVIGATION LINKS ── */}
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => (
              <SidebarNavLink
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                isOpen={sidebarOpen}
              />
            ))}
            {/* ── Quick Note (non-link nav action) — REMOVED:
                The Quick Note is now always accessible via the floating
                FAB button (GlobalQuickNote) mounted in AppShell. */}

          </nav>

          {/* ── DM TOOLS SEPARATOR ──
              Only visible when sidebar is open (expanded mode).
              Clicking the "Tools" label toggles the tools panel,
              preventing 15 tool buttons from overlapping navigation.
              Default state: collapsed (toolsOpen = false). */}
          {sidebarOpen && (
            <div className="px-3 pt-4 pb-1">
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className="flex items-center gap-2 w-full group cursor-pointer"
                title={toolsOpen ? "Collapse DM Tools" : "Expand DM Tools (15 tools)"}
                aria-label={toolsOpen ? "Collapse DM Tools" : "Expand DM Tools"}
              >
                <div className="h-px flex-1 bg-gradient-to-r from-gold-500/15 to-transparent" />
                <span className={`text-[7px] uppercase tracking-[0.15em] font-bold transition-all duration-200 ${
                  toolsOpen ? "text-gold-500/60" : "text-gold-500/40 group-hover:text-gold-500/60"
                }`}>
                  Tools {toolsOpen ? "▾" : "▸"}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-gold-500/15 to-transparent" />
              </button>
            </div>
          )}

          {/* ── ALL DM TOOLS (COLLAPSIBLE) ──
              Rendered from data array. Default collapsed (toolsOpen = false)
              to prevent 15 tool buttons from pushing navigation offscreen.
              In collapsed mode (w-16), tools ALWAYS show as icon-only since
              the "Tools" toggle is hidden — this is intentional because
              collapsed mode already has all items as icon-only.
              In expanded mode, clicking "Tools" header toggles visibility. */}
          <div className={`flex flex-col ${!sidebarOpen ? "items-center" : ""} space-y-0.5 ${
            sidebarOpen && !toolsOpen ? "hidden" : sidebarOpen ? "" : ""
          }`}>
            {dmTools.map((tool) => (
              <DmToolButton key={tool.eventName} tool={tool} isOpen={sidebarOpen} />
            ))}
          </div>

          {/* ── CONNECTED PLAYERS ── */}
          {sidebarOpen && (
            <div className="px-3 pt-4 pb-2">
              <div className="border-t border-white/[0.04] pt-3">
                <ConnectedPlayersPanel compact />
              </div>
            </div>
          )}

          {/* ── SYNC HEALTH ── */}
          <div className={`pt-2 ${!sidebarOpen ? "flex justify-center px-0" : "px-2"}`}>
            {sidebarOpen ? (
              <SyncHealthPanel />
            ) : (
              <button
                onClick={() => {
                  const event = new CustomEvent("toggle-sync-health");
                  window.dispatchEvent(event);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.04] hover:bg-white/[0.03] active:scale-95 transition-all duration-200"
                title="System Status"
                aria-label="Toggle System Status"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
              </button>
            )}
          </div>
        </div>

        {/* ── FOOTER ANCHOR ── */}
        <SidebarFooter isOpen={sidebarOpen} />
      </aside>
    </>
  );
}
