/**
 * STᚱ VTT — Token Inspector
 *
 * Right-side panel for inspecting and editing a selected map token.
 * DM can adjust position (x/y), HP, conditions, visibility, and label.
 * Composed of InspectorHeader, InspectorLabelInput, InspectorPositionInput,
 * InspectorHpSection, InspectorVisibilityToggle, InspectorColorPicker,
 * and InspectorFooter sub-components.
 * Uses useTokenInspector hook for state management.
 *
 * All changes sync instantly to the Theatric Display via campaignStore.
 */

import InspectorHeader from "./InspectorHeader";
import InspectorLabelInput from "./InspectorLabelInput";
import InspectorPositionInput from "./InspectorPositionInput";
import InspectorHpSection from "./InspectorHpSection";
import InspectorVisibilityToggle from "./InspectorVisibilityToggle";
import InspectorColorPicker from "./InspectorColorPicker";
import InspectorFooter from "./InspectorFooter";
import { useTokenInspector } from "./useTokenInspector";
import type { MapToken } from "@/types";

interface TokenInspectorProps {
  token: MapToken;
  mapId: string;
  onClose: () => void;
  onTokenUpdated?: (token: MapToken) => void;
}

export default function TokenInspector({
  token,
  mapId,
  onClose,
  onTokenUpdated,
}: TokenInspectorProps) {
  const {
    label,
    xPos,
    yPos,
    hpCurrent,
    hpMax,
    visible,
    color,
    hasChanges,
    setLabel,
    setXPos,
    setYPos,
    setHpCurrent,
    setHpMax,
    setVisible,
    setColor,
    markDirty,
    handleSave,
    handleDelete,
    handleQuickDamage,
    handleQuickHeal,
  } = useTokenInspector(token, mapId, onClose, onTokenUpdated);

  return (
    <div className="flex flex-col h-full min-h-0">
      <InspectorHeader icon={token.icon} onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <InspectorLabelInput
          value={label}
          onChange={(v) => {
            setLabel(v);
            markDirty();
          }}
        />
        <InspectorPositionInput
          x={xPos}
          y={yPos}
          onXChange={(v) => {
            setXPos(v);
            markDirty();
          }}
          onYChange={(v) => {
            setYPos(v);
            markDirty();
          }}
        />
        <InspectorHpSection
          hpCurrent={hpCurrent}
          hpMax={hpMax}
          onCurrentChange={(v) => {
            setHpCurrent(v);
            markDirty();
          }}
          onMaxChange={(v) => {
            setHpMax(v);
            markDirty();
          }}
          onQuickDamage={handleQuickDamage}
          onQuickHeal={handleQuickHeal}
        />
        <InspectorVisibilityToggle
          visible={visible}
          onChange={(v) => {
            setVisible(v);
            markDirty();
          }}
        />
        <InspectorColorPicker
          value={color}
          onChange={(v) => {
            setColor(v);
            markDirty();
          }}
        />
      </div>

      <InspectorFooter
        hasChanges={hasChanges}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
