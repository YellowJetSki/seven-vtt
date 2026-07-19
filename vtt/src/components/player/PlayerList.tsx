/**
 * ST R VTT - Player List (DM Management Hub)
 *
 * Complete DM-facing party management with:
 * - Party Power Matrix — at-a-glance tactical stats overview
 * - Character creation modal
 * - Per-card manage overlay (edit, duplicate, level up, delete)
 * - Mobile-first card grid
 * - Full PlayerSheet on tap
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCreateModal from "./PlayerCreateModal";
import PlayerListHeader from "./PlayerListHeader";
import PlayerListEmptyState from "./PlayerListEmptyState";
import PlayerListGrid from "./PlayerListGrid";
import PlayerCardCompact from "./PlayerCardCompact";
import PartyPowerMatrix from "./PartyPowerMatrix";
import PlayerSheet from "./PlayerSheet";
import type { PlayerCharacter } from "@/types";

export default function PlayerList() {
  const characters = useCampaignStore((s) => s.characters);
  const [activeSheetChar, setActiveSheetChar] = useState<PlayerCharacter | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const handleOpenSheet = useCallback((char: PlayerCharacter) => {
    setActiveSheetChar(char);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveSheetChar(null);
  }, []);

  return (
    <>
      <PlayerListHeader
        characterCount={characters.length}
        onAdd={() => setShowCreateModal(true)}
        onToggleMatrix={() => setShowMatrix((s) => !s)}
        showMatrix={showMatrix}
      />

      {/* Party Power Matrix — collapsible */}
      {showMatrix && characters.length > 0 && (
        <div className="mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <PartyPowerMatrix characters={characters} />
        </div>
      )}

      {characters.length === 0 ? (
        <PlayerListEmptyState onCreateFirst={() => setShowCreateModal(true)} />
      ) : (
        <PlayerListGrid>
          {characters.map((char) => (
            <PlayerCardCompact
              key={char.id}
              character={char}
              onOpen={handleOpenSheet}
            />
          ))}
        </PlayerListGrid>
      )}

      {showCreateModal && (
        <PlayerCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {activeSheetChar && (
        <PlayerSheet character={activeSheetChar} onClose={handleCloseSheet} />
      )}
    </>
  );
}
