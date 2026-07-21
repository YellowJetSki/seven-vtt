/**
 * STᚱ VTT — DM Time & Calendar Tracker
 *
 * Cycle 33: In-game time management tool. Tracks calendar date, time
 * of day, and time-based events ("the ritual completes in 3 hours").
 *
 * D&D 5e RAW: The standard adventuring day assumes the party can
 * handle 6-8 medium-to-hard encounters before needing a long rest.
 * Time tracking is essential for:
 *   - Determining when a long rest is possible (24h since last)
 *   - Tracking spell durations (1 min = 10 rounds, 10 min, 1 hour)
 *   - Event timers (rituals, traps, environmental effects)
 *   - Calendar management for campaign lore
 *
 * Features:
 *   - Real-time clock with Start/Pause/Reset controls
 *   - Speed multiplier (1×, 60×, 600×, 3600× for seconds/minutes/hours)
 *   - Calendar date tracking (day, month) with preset fantasy months
 *   - Time-of-day indicator (Dawn/Morning/Noon/Afternoon/Dusk/Night/Midnight)
 *   - Event timer list: add events with duration, real-time countdown
 *   - Color-coded urgency: normal (gold), <5m (amber), <1m (rose)
 *   - Per-event "Complete" and "Delete" actions
 *   - Active/paused duration display
 *   - Escape key + backdrop click to dismiss
 *   - Overrrides/Lusion premium glassmorphism
 *
 * Data: All state is local (no Firestore writes). Designed for
 *   quick session-side reference.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface DmTimeTrackerProps {
  onClose: () => void;
}

// ── Fantasy month names ──
const MONTHS = [
  "Hammer (Deepwinter)",
  "Alturiak (The Claw)",
  "Ches (The Sunsets)",
  "Tarsakh (The Storms)",
  "Mirtul (The Melting)",
  "Kythorn (The Time of Flowers)",
  "Flamerule (Summertide)",
  "Eleasis (Highsun)",
  "Eleint (The Fading)",
  "Marpenoth (Leaffall)",
  "Uktar (The Rotting)",
  "Nightal (The Drawing Down)",
];

const DAYS_PER_MONTH = 30;
const MONTH_DAYS = MONTHS.map(() => DAYS_PER_MONTH);

// ── Time-of-day indicators ──
function getTimeOfDay(hours: number, minutes: number): { label: string; color: string; icon: string } {
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < 1 * 60 + 30) return { label: "Midnight", color: "text-indigo-400", icon: "🌙" };
  if (totalMinutes < 5 * 60) return { label: "Night", color: "text-indigo-400", icon: "🌙" };
  if (totalMinutes < 6 * 60 + 30) return { label: "Dawn", color: "text-amber-300", icon: "🌅" };
  if (totalMinutes < 8 * 60) return { label: "Morning", color: "text-gold-300", icon: "☀️" };
  if (totalMinutes < 12 * 60) return { label: "Late Morning", color: "text-gold-300", icon: "☀️" };
  if (totalMinutes < 14 * 60) return { label: "Noon", color: "text-gold-400", icon: "☀️" };
  if (totalMinutes < 17 * 60) return { label: "Afternoon", color: "text-gold-300", icon: "☀️" };
  if (totalMinutes < 19 * 60 + 30) return { label: "Dusk", color: "text-amber-400", icon: "🌆" };
  if (totalMinutes < 21 * 60) return { label: "Evening", color: "text-surface-400", icon: "🌆" };
  return { label: "Night", color: "text-indigo-400", icon: "🌙" };
}

// ── Moon phase ──
function getMoonPhase(day: number): { label: string; icon: string } {
  const phase = day % 30;
  if (phase < 2) return { label: "New Moon", icon: "🌑" };
  if (phase < 7) return { label: "Waxing Crescent", icon: "🌒" };
  if (phase < 10) return { label: "First Quarter", icon: "🌓" };
  if (phase < 15) return { label: "Waxing Gibbous", icon: "🌔" };
  if (phase < 17) return { label: "Full Moon", icon: "🌕" };
  if (phase < 22) return { label: "Waning Gibbous", icon: "🌖" };
  if (phase < 25) return { label: "Last Quarter", icon: "🌗" };
  if (phase < 29) return { label: "Waning Crescent", icon: "🌘" };
  return { label: "New Moon", icon: "🌑" };
}

// ── Time event ──
interface TimeEvent {
  id: string;
  label: string;
  remainingSeconds: number;
  completed: boolean;
}

export default function DmTimeTracker({ onClose }: DmTimeTrackerProps) {
  // ── Escape key ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Calendar state ──
  const [year, setYear] = useState(1495); // DR (Dalereckoning)
  const [monthIndex, setMonthIndex] = useState(3); // Tarsakh
  const [day, setDay] = useState(15);

  // ── Clock state ──
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 60 | 600 | 3600>(1); // 1s, 1min, 10min, 1h per second

  const clockRef = useRef<{ h: number; m: number; d: number; mi: number; y: number }>({
    h: hours, m: minutes, d: day, mi: monthIndex, y: year,
  });

  // Keep ref in sync
  useEffect(() => {
    clockRef.current = { h: hours, m: minutes, d: day, mi: monthIndex, y: year };
  }, [hours, minutes, day, monthIndex, year]);

  // ── Clock tick ──
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const c = clockRef.current;
      let newMinutes = c.m + speed * (1 / 60);
      let newHours = c.h;
      let newDay = c.d;
      let newMonth = c.mi;
      let newYear = c.y;

      if (newMinutes >= 60) {
        const extraHours = Math.floor(newMinutes / 60);
        newMinutes = newMinutes % 60;
        newHours += extraHours;
      }

      if (newHours >= 24) {
        const extraDays = Math.floor(newHours / 24);
        newHours = newHours % 24;
        newDay += extraDays;
      }

      while (newDay > MONTH_DAYS[newMonth]) {
        newDay -= MONTH_DAYS[newMonth];
        newMonth++;
        if (newMonth >= 12) {
          newMonth = 0;
          newYear++;
        }
      }

      if (newDay < 1) newDay = 1;

      setMinutes(Math.round(newMinutes));
      setHours(newHours);
      setDay(newDay);
      setMonthIndex(newMonth);
      setYear(newYear);
    }, 1000);

    return () => clearInterval(interval);
  }, [speed, running]);

  // ── Events ──
  const [events, setEvents] = useState<TimeEvent[]>([]);
  const [eventInput, setEventInput] = useState("");
  const [eventDuration, setEventDuration] = useState(10); // minutes
  const eventsRef = useRef(events);
  eventsRef.current = events;

  // ── Event tick ──
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const current = eventsRef.current;
      const updated = current
        .map((e) => {
          if (e.completed) return e;
          const remaining = e.remainingSeconds - speed;
          return remaining <= 0
            ? { ...e, remainingSeconds: 0, completed: true }
            : { ...e, remainingSeconds: remaining };
        });
      setEvents(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [running, speed]);

  const addEvent = useCallback(() => {
    if (!eventInput.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: eventInput.trim(),
        remainingSeconds: eventDuration * 60,
        completed: false,
      },
    ]);
    setEventInput("");
  }, [eventInput, eventDuration]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const tod = getTimeOfDay(hours, minutes);
  const moon = getMoonPhase(day);

  const formattedDate = `${MONTHS[monthIndex]} ${day}, ${year} DR`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm max-h-[85vh] overflow-hidden
          bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
          border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
          animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="restRecovery" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">
              Time & Calendar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── CALENDAR DATE ── */}
        <div className="mx-3 mb-1 p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-center gap-1 text-[9px] text-gold-300 font-display">
            {formattedDate}
          </div>
          <div className="flex items-center justify-center gap-2 text-[7px] text-surface-500 mt-px">
            <span>{tod.icon} {tod.label}</span>
            <span className="text-surface-600">·</span>
            <span>{moon.icon} {moon.label}</span>
          </div>
          {/* Quick date adjusters */}
          <div className="flex items-center justify-center gap-0.5 mt-px">
            <button
              onClick={() => { setDay((d) => Math.max(1, d - 1)); }}
              className="text-[6px] px-1 py-px rounded bg-surface-800/40 text-surface-500 hover:text-white/60 border border-white/[0.03] transition-colors"
              title="Previous day"
            >
              -1d
            </button>
            <button
              onClick={() => {
                setMonthIndex((m) => (m - 1 + 12) % 12);
              }}
              className="text-[6px] px-1 py-px rounded bg-surface-800/40 text-surface-500 hover:text-white/60 border border-white/[0.03] transition-colors"
              title="Previous month"
            >
              -1m
            </button>
            <button
              onClick={() => setDay((d) => d + 1)}
              className="text-[6px] px-1 py-px rounded bg-surface-800/40 text-surface-500 hover:text-white/60 border border-white/[0.03] transition-colors"
              title="Next day"
            >
              +1d
            </button>
            <button
              onClick={() => setMonthIndex((m) => (m + 1) % 12)}
              className="text-[6px] px-1 py-px rounded bg-surface-800/40 text-surface-500 hover:text-white/60 border border-white/[0.03] transition-colors"
              title="Next month"
            >
              +1m
            </button>
          </div>
        </div>

        {/* ── CLOCK DISPLAY ── */}
        <div className="mx-3 mb-1 p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xl font-mono tabular-nums ${tod.color}`}>
              {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
            </span>
          </div>
          {/* Clock controls */}
          <div className="flex items-center justify-center gap-0.5 mt-px">
            <button
              onClick={() => setRunning(!running)}
              className={`text-[7px] px-1.5 py-px rounded transition-all ${
                running
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/10"
                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/10"
              }`}
            >
              {running ? "⏸ Pause" : "▶ Start"}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setHours(9);
                setMinutes(0);
                setDay(15);
                setMonthIndex(3);
                setYear(1495);
                setEvents([]);
              }}
              className="text-[7px] px-1.5 py-px rounded bg-rose-500/10 text-rose-300 border border-rose-500/10 hover:bg-rose-500/15"
            >
              ↺ Reset
            </button>
          </div>
          {/* Speed selector */}
          <div className="flex items-center justify-center gap-0.5 mt-px">
            {([1, 60, 600, 3600] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-[6px] px-1 py-px rounded transition-all ${
                  speed === s
                    ? "bg-gold-500/10 text-gold-300 border border-gold-500/20"
                    : "text-surface-500 hover:text-surface-400 border border-white/[0.03]"
                }`}
              >
                {s === 1 ? "1×" : s === 60 ? "1m/s" : s === 600 ? "10m/s" : "1h/s"}
              </button>
            ))}
          </div>
        </div>

        {/* ── EVENTS ── */}
        <div className="mx-3 mb-1">
          <span className="text-[7px] text-surface-500 uppercase tracking-wider">
            Timers & Events
          </span>

          {/* Add event form */}
          <div className="flex items-center gap-0.5 mt-px">
            <input
              value={eventInput}
              onChange={(e) => setEventInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addEvent(); }}
              placeholder="Event label..."
              className="flex-1 bg-[#07080d]/70 border border-white/[0.04] rounded px-1 py-0.5 text-[7px] text-white/80
                placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15
                transition-all"
            />
            <select
              value={eventDuration}
              onChange={(e) => setEventDuration(Number(e.target.value))}
              className="bg-[#07080d]/70 border border-white/[0.04] rounded px-0.5 py-0.5 text-[7px] text-white/60
                focus:outline-none focus:border-gold-500/25"
            >
              <option value={1}>1 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={360}>6 hours</option>
              <option value={720}>12 hours</option>
              <option value={1440}>24 hours</option>
            </select>
            <button
              onClick={addEvent}
              className="px-1 py-0.5 rounded bg-gold-500/12 text-gold-300 border border-gold-500/20 text-[7px] hover:bg-gold-500/18 transition-colors"
            >
              + Add
            </button>
          </div>

          {/* Event list */}
          <div className="space-y-px mt-px max-h-[160px] overflow-y-auto scrollbar-gold">
            {events.length === 0 && (
              <div className="p-1 text-center">
                <p className="text-[7px] text-surface-500 italic">
                  No active timers
                </p>
              </div>
            )}
            {events.map((evt, i) => {
              const pct = evt.completed ? 0 : evt.remainingSeconds / (eventDuration * 60);
              const urgent = !evt.completed && evt.remainingSeconds < 60;
              const warning = !evt.completed && evt.remainingSeconds < 300;

              return (
                <div
                  key={evt.id}
                  className="flex items-center gap-0.5 p-0.5 rounded bg-surface-800/15 border border-white/[0.02]
                    animate-in slide-in-from-bottom-1 fade-in duration-200"
                  style={{ animationDelay: `${i * 20}ms`, animationFillMode: "forwards" }}
                >
                  {/* Progress indicator */}
                  <div
                    className={`w-0.5 h-5 rounded-full transition-colors ${
                      evt.completed
                        ? "bg-surface-600"
                        : urgent
                        ? "bg-rose-500"
                        : warning
                        ? "bg-amber-500"
                        : "bg-gold-500/40"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-[7px] truncate block ${
                        evt.completed ? "text-surface-600 line-through" : urgent ? "text-rose-300" : "text-white/70"
                      }`}
                    >
                      {evt.label}
                    </span>
                    <span
                      className={`text-[6px] ${
                        evt.completed
                          ? "text-surface-700"
                          : urgent
                          ? "text-rose-400"
                          : warning
                          ? "text-amber-400"
                          : "text-surface-500"
                      }`}
                    >
                      {evt.completed ? "Done" : formatTime(evt.remainingSeconds)}
                      {urgent && !evt.completed && " ⚠️ Expiring"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setEvents((prev) =>
                        prev.map((e) => (e.id === evt.id ? { ...e, completed: !e.completed } : e))
                      )
                    }
                    className={`text-[6px] px-0.5 py-px rounded border transition-colors ${
                      evt.completed
                        ? "bg-surface-800/40 text-surface-500 border-white/[0.02]"
                        : "bg-emerald-500/8 text-emerald-300 border-emerald-500/10 hover:bg-emerald-500/12"
                    }`}
                  >
                    {evt.completed ? "↺" : "✓"}
                  </button>
                  <button
                    onClick={() => setEvents((prev) => prev.filter((e) => e.id !== evt.id))}
                    className="text-[6px] px-0.5 py-px rounded bg-rose-500/8 text-rose-300 border border-rose-500/10 hover:bg-rose-500/12 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mx-3 mb-1 p-1 rounded-lg bg-surface-800/20 border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-surface-500">
              {events.filter((e) => !e.completed).length} active · {events.length} total
              {running && " · " + (speed === 1 ? "1s=1s" : speed === 60 ? "1s=1m" : speed === 600 ? "1s=10m" : "1s=1h")}
            </span>
            <span className="text-[6px] text-surface-600">
              {tod.icon} {tod.label}
            </span>
          </div>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}
