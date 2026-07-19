/**
 * STᚱ VTT — Player List
 *
 * Displays all player characters in a mobile-first layout with
 * a DM-facing creation modal that supports name, race, class, level,
 * and image URL (full-width banner on the character sheet).
 * Composed of PlayerListHeader, PlayerListEmptyState, PlayerListGrid,
 * PlayerCardCompact, and PlayerCreateModal sub-components.
 *
 * - Mobile: Single column card list
 * - Tablet: 2-column grid
 * - Desktop: 3-column grid
 *
 * Each card shows key stats at a glance. Tapping opens full PlayerSheet modal.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCreateModal from "./PlayerCreateModal";
import PlayerListHeader from "./PlayerListHeader";
import PlayerListEmptyState from "./PlayerListEmptyState";
import PlayerListGrid from "./PlayerListGrid";
import PlayerCardCompact from "./PlayerCardCompact";
import PlayerSheet from "./PlayerSheet";
import type { PlayerCharacter } from "@/types";

export default function PlayerList() {
  const characters = useCampaignStore((s) => s.characters);
  const [activeSheetChar, setActiveSheetChar] =
    useState<PlayerCharacter | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      />

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
