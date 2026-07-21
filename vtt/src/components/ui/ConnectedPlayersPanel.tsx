/**
 * STᚱ VTT — Connected Players Panel (Sprint 10)
 *
 * DM-accessible panel showing which players are currently connected
 * to the campaign. Integrated into the sidebar under Sync Health.
 *
 * Features:
 *   - Live player list with character names and player handles
 *   - Connection indicator per player (green = active heartbeat)
 *   - Total connected count
 *   - Empty state when no players are online
 *   - Role badges (Player/DM)
 *   - Stale entry protection (entries older than 90s filtered out)
 *
 * Data source: Firestore /campaign/{id}/presence/{charId}
 *   Each connected player writes a heartbeat every 30s.
 *   DM subscribes via onSnapshot.
 */

import { usePresenceSubscription } from "@/hooks/usePresence";

interface ConnectedPlayersPanelProps {
  compact?: boolean;
}

export default function ConnectedPlayersPanel({ compact = false }: ConnectedPlayersPanelProps) {
  const { connectedPlayers, isLoading, connectedCount } = usePresenceSubscription();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
          Connected Players
        </h4>
        <div className="flex items-center justify-center py-4">
          <div className="w-3 h-3 border border-gold-500/30 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
          Connected Players
        </h4>
        {connectedCount > 0 && (
          <span className="text-[8px] text-surface-600 bg-white/[0.03] px-1.5 py-0.5 rounded">
            {connectedCount}
          </span>
        )}
      </div>

      {connectedPlayers.length === 0 ? (
        <div className="py-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.03] flex items-center justify-center mx-auto mb-2 text-lg">
            👤
          </div>
          <p className="text-[9px] text-surface-500">
            {compact ? "No players connected" : "No players are currently connected to the campaign."}
          </p>
          <p className="text-[8px] text-surface-700 mt-1">
            Players can join via the login page or a join code.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {connectedPlayers.map((player) => (
            <div
              key={player.characterId}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.04] hover:border-white/[0.07] hover:bg-white/[0.04] transition-all duration-200"
            >
              {/* Status dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)] shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-white/80 truncate">
                    {player.playerName}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-gold-400/50 bg-gradient-to-r from-gold-500/12 to-amber-500/8 px-1.5 py-0.5 rounded font-medium">
                    {player.role}
                  </span>
                </div>
                <p className="text-[8px] text-surface-500 truncate font-mono">
                  {player.characterId.slice(0, 16)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
