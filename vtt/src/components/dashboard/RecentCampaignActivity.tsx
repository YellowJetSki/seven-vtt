/**
 * STᚱ VTT — Recent Campaign Activity (Overrrides-Grade Live Timeline)
 *
 * A compact timeline showing the 5 most recent campaign activities:
 * - Journal entries (newest quick notes, quests, lore)
 * - Character milestones (level-ups)
 * - Encounter completions
 * - Campaign milestones (session starts)
 *
 * Designed for at-a-glance scanning during a live session.
 * Premium glass card with staggered item entrances and
 * color-coded type badges.
 */

import { useMemo } from "react";
import type { JournalEntry, PlayerCharacter, CampaignMeta, Encounter } from "@/types";
import { staggerEntrance, ease, duration, glassCardWithEdge, buttonVariant, goldEdgeLight, focusRingGold } from "@/lib/design-tokens";

type ActivityEvent = {
  id: string;
  type: "journal" | "levelup" | "session" | "encounter" | "note";
  timestamp: number;
  title: string;
  description: string;
  icon: string;
  accent: "gold" | "amber" | "emerald" | "rose" | "cyan" | "violet";
};

interface RecentCampaignActivityProps {
  journal: JournalEntry[];
  characters: PlayerCharacter[];
  meta: CampaignMeta;
  encounters: Encounter[];
  onNavigate?: (path: string) => void;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  journal: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  note: { bg: "bg-gold-500/10", text: "text-gold-400", border: "border-gold-500/20" },
  levelup: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  session: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  encounter: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

export default function RecentCampaignActivity({
  journal,
  characters,
  meta,
  encounters,
  onNavigate,
}: RecentCampaignActivityProps) {
  // Build activity events from multiple sources
  const events = useMemo(() => {
    const result: ActivityEvent[] = [];

    // Journal entries (newest first, capped at 3)
    if (journal && journal.length > 0) {
      const sorted = [...journal].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      sorted.slice(0, 3).forEach((entry) => {
        const isNote = entry.type === "note";
        result.push({
          id: `journal-${entry.id}`,
          type: isNote ? "note" : "journal",
          timestamp: entry.createdAt ?? Date.now(),
          title: entry.title || "Untitled Note",
          description: entry.content ? entry.content.slice(0, 80) + (entry.content.length > 80 ? "..." : "") : "",
          icon: isNote ? "📝" : entry.type === "quest" ? "⚔" : entry.type === "lore" ? "📜" : "📖",
          accent: isNote ? "gold" : "cyan",
        });
      });
    }

    // Character level-ups (simulated from highest-level chars)
    if (characters && characters.length > 0) {
      const sorted = [...characters].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      sorted.slice(0, 2).forEach((char) => {
        if (char.level && char.level > 1) {
          result.push({
            id: `levelup-${char.id}`,
            type: "levelup",
            timestamp: char.updatedAt ?? Date.now(),
            title: `${char.name} reached Level ${char.level}!`,
            description: `${char.race ?? "Adventurer"} ${char.class ?? "Class"} — ${char.level} total levels`,
            icon: "⬆",
            accent: "emerald",
          });
        }
      });
    }

    // Session start (from meta stats)
    if (meta && meta.stats?.sessionCount && meta.stats.sessionCount > 0) {
      result.push({
        id: "session-current",
        type: "session",
        timestamp: meta.updatedAt ?? Date.now(),
        title: `Session #${meta.stats.sessionCount}`,
        description: `${meta.stats.sessionCount} total sessions run in the Arkla campaign`,
        icon: "🎲",
        accent: "violet",
      });
    }

    // Sort ALL events by timestamp descending
    result.sort((a, b) => b.timestamp - a.timestamp);

    // Cap at 5 events
    return result.slice(0, 5);
  }, [journal, characters, meta, encounters]);

  if (events.length === 0) {
    return (
      <div className={`relative ${glassCardWithEdge("card")}`}>
        <div className={goldEdgeLight} />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-white/80">Recent Activity</h3>
          </div>
          <p className="text-[10px] text-surface-500 italic leading-relaxed">
            No recent activity yet. Start your session to see events here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${glassCardWithEdge("card")}`}>
      <div className={goldEdgeLight} />

      <div className="relative z-10 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[11px] font-bold text-white/80 tracking-tight">Recent Activity</h3>
            {events.length > 0 && (
              <span className="text-[8px] text-surface-500 tabular-nums">{events.length}</span>
            )}
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("/campaign/journal")}
              className="text-[8px] text-surface-500 hover:text-gold-400 transition-colors duration-200"
            >
              View All
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-2.5 top-1 bottom-1 w-px bg-gradient-to-b from-gold-500/20 via-gold-500/10 to-transparent pointer-events-none" />

          <div className="space-y-1.5">
            {events.map((event, idx) => {
              const styles = TYPE_STYLES[event.type] || TYPE_STYLES.note;
              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-2.5 pl-7 py-1.5 rounded-lg hover:bg-white/[0.02] transition-all duration-150 group"
                  style={staggerEntrance(idx, 40)}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[7px] top-[7px] w-[11px] h-[11px] rounded-full border-2 ${styles.border} ${styles.bg} flex items-center justify-center shadow-[0_0_4px_rgba(0,0,0,0.2)]`}>
                    <span className="text-[5px] leading-none">{event.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold text-white/70 truncate group-hover:text-white/85 transition-colors duration-150">
                        {event.title}
                      </p>
                      <span className={`shrink-0 text-[7px] px-1 py-[1px] rounded ${styles.bg} ${styles.text} ${styles.border} border font-semibold uppercase tracking-wider`}>
                        {event.type}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-[9px] text-surface-500 mt-px truncate">
                        {event.description}
                      </p>
                    )}
                    <span className="text-[7px] text-surface-600 mt-0.5 block tabular-nums">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
