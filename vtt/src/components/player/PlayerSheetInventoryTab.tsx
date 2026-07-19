import type { PlayerCharacter } from "@/types";

interface PlayerSheetInventoryTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetInventoryTab({ character }: PlayerSheetInventoryTabProps) {
  const c = character;
  const equipment = c.equipment || [];
  const inventory = c.inventory || [];
  const currency = c.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };

  const coins = [
    { label: "PP", key: "platinum" as const, value: currency.platinum, color: "text-cyan-300" },
    { label: "GP", key: "gold" as const, value: currency.gold, color: "text-amber-400" },
    { label: "EP", key: "electrum" as const, value: currency.electrum, color: "text-purple-400" },
    { label: "SP", key: "silver" as const, value: currency.silver, color: "text-surface-300" },
    { label: "CP", key: "copper" as const, value: currency.copper, color: "text-amber-600" },
  ];

  return (
    <div className="px-3 py-3 space-y-4">
      {/* Currency — gold cards */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Currency</span>
        <div className="grid grid-cols-5 gap-1.5">
          {coins.map((coin) => (
            <div key={coin.key} className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-2.5 hover:border-gold/10 transition-all duration-200">
              <span className="text-[9px] uppercase font-black text-gold-500/50">{coin.label}</span>
              <span className={`text-base font-bold tabular-nums ${coin.color}`}>{coin.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment — gold rows */}
      {equipment.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Equipment</span>
          <div className="space-y-1">
            {equipment.map((eq, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-gold-500/50 font-semibold w-16 shrink-0">{eq.slot}</span>
                  <span className="text-xs text-surface-300">{eq.item}</span>
                </div>
                {eq.quantity > 1 && <span className="text-[10px] text-surface-500">×{eq.quantity}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory — gold rows */}
      {inventory.length > 0 ? (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Inventory</span>
          <div className="space-y-1">
            {inventory.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs ${item.isEquipped ? "text-gold-400 font-semibold" : "text-surface-300"} truncate`}>
                    {item.name}
                  </span>
                  {item.isEquipped && <span className="text-[8px] uppercase bg-gold-500/10 text-gold-400 px-1 py-0.5 rounded border border-gold/15">Equipped</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-surface-500">{item.weight} lb</span>
                  {item.quantity > 1 && <span className="text-[10px] text-surface-500">×{item.quantity}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-surface-500 text-xs">No items in inventory</p>
          <div className="mt-2 text-gold-500/20 text-xs">✦ ✦ ✦</div>
        </div>
      )}
    </div>
  );
}
