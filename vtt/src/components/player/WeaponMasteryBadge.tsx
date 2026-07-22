/**
 * STᚱ VTT — Weapon Mastery Badge Component
 *
 * Shows the 5.5e Weapon Mastery property for a given weapon.
 * Used in the Combat Tab's weapon card and inventory item detail.
 */
import { WEAPON_MASTERIES, getMasteryForWeapon, MARTIAL_CLASSES, type MasteryType } from "@/data/srd-weapon-masteries";

interface WeaponMasteryBadgeProps {
  weaponName: string;
  className?: string;
  size?: "sm" | "md";
}

export default function WeaponMasteryBadge({ weaponName, className: _cn, size = "sm" }: WeaponMasteryBadgeProps) {
  const masteryKey = getMasteryForWeapon(weaponName);
  if (!masteryKey) return null;

  const mastery = WEAPON_MASTERIES[masteryKey];
  const sizeClass = size === "sm" ? "text-[9px] px-1 py-0.5 gap-0.5" : "text-[10px] px-1.5 py-0.5 gap-1";

  return (
    <span
      title={`${mastery.name}: ${mastery.effect}`}
      className={`inline-flex items-center rounded ${sizeClass} bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium`}
    >
      <span className="text-[8px]">{mastery.icon}</span>
      <span>{mastery.name}</span>
    </span>
  );
}

export function canUseMastery(playerClass: string): boolean {
  return MARTIAL_CLASSES.has(playerClass);
}
