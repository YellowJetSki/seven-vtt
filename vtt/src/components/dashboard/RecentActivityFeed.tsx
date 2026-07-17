/* ── Recent Activity Feed ──────────────────────────────────────
 * Displays recent campaign activity: journal entries, encounters,
 * and new player characters — sorted by most recent.
 * Uses individual selectors (not derived campaign) to avoid re-render loops.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter, JournalEntry, Encounter } from "@/types";

interface ActivityItem {
  id: string;
  type: "journal" | "encounter" | "character";
  label: string;
  description: string;
  timestamp: number;
  href: string;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  journal: { icon: "📝", color: "bg-amber-500/15 text-amber-400" },
  encounter: { icon: "⚔️", color: "bg-warrior-500/15 text-warrior-400" },
  character: { icon: "🧝", color: "bg-rogue-500/15 text-rogue-400" },
};

export function RecentActivityFeed() {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const journal = useCampaignStore((s) => s.journal);
  const encounters = useCampaignStore((s) => s.encounters);

  const activities = useMemo((): ActivityItem[] => {
    if (!meta) return [];
    const items: ActivityItem[] = [];

    // Recent journal entries
    for (const entry of journal.slice(-5)) {
      items.push({
        id: `journal-${entry.id}`,
        type: "journal",
        label: entry.title,
        description: `Journal · ${entry.type}`,
        timestamp: entry.createdAt,
        href: "/campaign/journal",
      });
    }

    // Recent encounters
    for (const enc of encounters.slice(-3)) {
      items.push({
        id: `encounter-${enc.id}`,
        type: "encounter",
        label: enc.name,
        description: `Encounter · ${enc.difficulty ?? "unknown"} · ${enc.enemies.reduce((s, e) => s + e.count, 0)} enemies`,
        timestamp: enc.createdAt,
        href: "/campaign/encounters",
      });
    }

    // Recent characters
    for (const pc of characters.slice(-3)) {
      items.push({
        id: `character-${pc.id}`,
        type: "character",
        label: pc.name,
        description: `${pc.race} ${pc.class} · Level ${pc.level}`,
        timestamp: pc.createdAt,
        href: "/campaign/player-cards",
      });
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 8);
  }, [meta, characters, journal, encounters]);

  if (!meta || activities.length === 0) return null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-2">
        <span>📋</span> Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((item) => {
          const config = TYPE_CONFIG[item.type];
          return (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-800 group"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${config.color}`}>
                {config.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-200 truncate group-hover:text-accent-300 transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-surface-500">{item.description}</p>
              </div>
              <span className="text-[10px] text-surface-600 shrink-0">{formatRelativeTime(item.timestamp)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
