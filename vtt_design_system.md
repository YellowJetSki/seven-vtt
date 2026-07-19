# VTT MASTER DESIGN SYSTEM & UI/UX ARCHITECTURE

## 1. CORE AESTHETIC DIRECTIVE
The application MUST embody a highly detailed fantasy digital art aesthetic, strictly using modern D&D 5e official artwork as the reference standard. The UI must feel premium, immersive, and tactile, avoiding flat, "developer-grade" generic interfaces. 

## 2. STRICT COLOR PALETTE & TOKENS (TAILWIND)
You are forbidden from guessing colors. You must use the following established Tailwind utility tokens for all UI elements:
*   **Base Backgrounds (The Void):** `bg-slate-950` or `bg-neutral-950`.
*   **Surface Panels (Obsidian/Parchment):** `bg-slate-900/90` combined with `backdrop-blur-md` for glassmorphism over the Canvas.
*   **Primary Accents (Arcane Gold):** `text-amber-500`, `border-amber-500/50`.
*   **Secondary Accents (Deep Magic):** `text-indigo-400`, `border-indigo-500/50`.
*   **Typography (Primary):** `text-slate-200` for high-readability body text.
*   **Typography (Headings):** `text-amber-50` with `font-serif` to emulate official D&D hardcover books.
*   **Danger/Combat (Blood/Fire):** `text-rose-500`, `bg-rose-950/50`, `border-rose-500/50`.
*   **Success/Healing (Nature):** `text-emerald-400`, `bg-emerald-950/50`, `border-emerald-500/50`.

## 3. LAYOUT & VIEWPORT SURVIVAL (ANTI-SQUISH LAWS)
To prevent UI collapsing and overlap, the following structural rules are absolute:
*   **The Master Shell:** The root application wrapper MUST use `h-screen w-screen overflow-hidden flex`.
*   **The Canvas Zone:** The actual game board (WebGL/Canvas) must use `flex-grow relative` or absolute positioning spanning the entire screen. It sits *behind* the UI.
*   **DOM Sidebars & HUDs:** All sidebars, chat windows, and initiative trackers MUST have explicit minimum and maximum boundaries (e.g., `min-w-[320px] max-w-sm`). They must never be allowed to shrink infinitely (`shrink-0`).
*   **Scrollable Regions:** Any list (chat, inventory, initiative) must be wrapped in its own container with `overflow-y-auto` and custom, slim scrollbars to prevent breaking the parent container's height.

## 4. TACTILE MICRO-INTERACTIONS
Every interactive element must provide immediate, satisfying visual feedback:
*   **Standard Transitions:** Apply `transition-all duration-200 ease-in-out` to all buttons and links.
*   **Hover States:** Buttons should subtly illuminate or lift, e.g., `hover:bg-amber-500/10 hover:border-amber-400 hover:-translate-y-0.5`.
*   **Active States:** `active:scale-95 active:bg-amber-500/20`.
*   **Shadows:** Use rich, deep shadows for floating panels: `shadow-xl shadow-black/50`.

## 5. COMPONENT MODULARITY (THE MONOLITH BAN)
You are strictly forbidden from building single, massive files containing multiple UI sections. 
*   Wherever possible, use individual re-usable components so that we avoid having one giant file.
*   If a file handles the Initiative Tracker, it ONLY handles the Initiative Tracker.
*   If a file exceeds 150 lines, pause your current sprint and break it down into smaller sub-components.

## 6. TRUE MOBILE-FIRST RESPONSIVE ARCHITECTURE & HARDWARE TARGETING
The application MUST be built using a strict hardware-specific targeting methodology:
*   **Base Classes (Mobile PC Sheets):** All default Tailwind utility classes must be written for phone screens first (e.g., stacking elements vertically with `flex-col`, using massive `h-12 w-12` touch targets, and ensuring swipeable tabs). The mobile view is explicitly for Player HUDs, Character Sheets, and Inventory management.
*   **Scaling Up (Breakpoints):** You must use Tailwind's responsive modifiers (`md:`, `lg:`, `xl:`) to progressively enhance the UI for larger screens. 
*   **DM Desktop (`lg:` and up):** Only apply dense CSS Grid layouts and multi-panel combat trackers at the `lg:` breakpoint and above, assuming a master laptop view.
*   **Theatric Monitor (External TVs/Monitors):** 100% Canvas. Zero UI elements, zero grids. Pure, unobstructed fantasy map visualization designed explicitly for large external displays. You do not need to optimize the interactive battlemap grid for mobile phone viewports.
*   **Legibility:** Ensure no text is smaller than `text-base` on mobile to guarantee readability for players making split-second tabletop decisions without zooming.