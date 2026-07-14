import type { PlayerCharacter } from "@/types";

interface PlayerCharacterSheetProps {
  character: PlayerCharacter;
}

/**
 * A beautifully crafted character sheet for player view.
 * Displays everything a player needs in a mobile-first layout.
 */
export function PlayerCharacterSheet({ character }: PlayerCharacterSheetProps) {
  const hpPercent = Math.max(
    0,
    (character.hitPoints.current / character.hitPoints.max) * 100,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-850">
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-accent-500 via-mage-500 to-rogue-500" />

        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            {/* Portrait Placeholder */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700 md:h-24 md:w-24">
              <span className="text-3xl md:text-4xl">
                {character.race === "Dragonborn" ? "🐉" :
                 character.race === "Elf" ? "🧝" :
                 character.race === "Dwarf" ? "⛰" :
                 character.race === "Halfling" ? "🍃" :
                 character.race === "Gnome" ? "🔧" :
                 character.race === "Half-Orc" ? "💪" :
                 character.race === "Tiefling" ? "😈" :
                 "⚔"}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-surface-100 md:text-3xl">
                {character.name}
              </h1>
              <p className="mt-0.5 text-sm text-surface-400">
                {character.race}
                {character.subclass
                  ? ` · ${character.subclass} ${character.class}`
                  : ` · ${character.class}`}{" "}
                · Level {character.level}
              </p>
              <p className="mt-0.5 text-xs text-surface-500">
                {character.alignment ?? "Unaligned"} ·{" "}
                {character.background ?? "No Background"}
              </p>
            </div>

            {/* XP Badge */}
            <div className="hidden shrink-0 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-center md:block">
              <p className="text-xs text-gold-400">XP</p>
              <p className="text-sm font-bold text-gold-400">
                {character.experience.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Player Name */}
          <p className="mt-3 text-xs text-surface-500">
            Played by <span className="text-surface-400">{character.playerName}</span>
          </p>
        </div>
      </div>

      {/* HP + AC + Initiative Strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} color="warrior" />
        <StatPill label="AC" value={String(character.armorClass)} color="mage" />
        <StatPill label="Initiative" value={`+${character.initiative}`} color="rogue" />
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
          <span>Hit Points</span>
          <span>
            {character.hitPoints.current} / {character.hitPoints.max}
            {character.hitPoints.temporary > 0 &&
              ` (+${character.hitPoints.temporary} temp)`}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${hpPercent}%`,
              background:
                hpPercent > 50
                  ? "var(--color-rogue-500)"
                  : hpPercent > 25
                    ? "var(--color-divine-500)"
                    : "var(--color-warrior-500)",
            }}
          />
        </div>
      </div>

      {/* Ability Scores */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
          Ability Scores
        </h2>
        <div className="grid grid-cols-6 gap-2">
          {(
            [
              { key: "strength", abbr: "STR" },
              { key: "dexterity", abbr: "DEX" },
              { key: "constitution", abbr: "CON" },
              { key: "intelligence", abbr: "INT" },
              { key: "wisdom", abbr: "WIS" },
              { key: "charisma", abbr: "CHA" },
            ] as const
          ).map(({ key, abbr }) => {
            const score = character.abilityScores[key];
            const mod = Math.floor((score - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div
                key={key}
                className="rounded-lg bg-surface-800 py-2.5 text-center"
              >
                <p className="text-[10px] font-semibold uppercase text-surface-500">
                  {abbr}
                </p>
                <p className="mt-0.5 text-lg font-bold text-surface-100">
                  {score}
                </p>
                <p
                  className={`text-xs font-medium ${
                    mod >= 0 ? "text-rogue-400" : "text-warrior-400"
                  }`}
                >
                  {modStr}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws & Skills */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Saving Throws */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Saving Throws
          </h2>
          <div className="space-y-1.5">
            {(
              [
                { key: "strength", abbr: "STR" },
                { key: "dexterity", abbr: "DEX" },
                { key: "constitution", abbr: "CON" },
                { key: "intelligence", abbr: "INT" },
                { key: "wisdom", abbr: "WIS" },
                { key: "charisma", abbr: "CHA" },
              ] as const
            ).map(({ key, abbr }) => {
              const val = character.savingThrows[key] ?? 0;
              const isProficient = val !== 0;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {isProficient && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />
                    )}
                    <span
                      className={`text-sm ${
                        isProficient ? "font-semibold text-surface-100" : "text-surface-400"
                      }`}
                    >
                      {abbr}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-mono font-bold ${
                      val >= 0 ? "text-rogue-400" : "text-warrior-400"
                    }`}
                  >
                    {val >= 0 ? "+" : ""}
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Skills */}
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Skills
          </h2>
          <div className="grid grid-cols-1 gap-1">
            {(
              [
                { key: "acrobatics", label: "Acrobatics" },
                { key: "animalHandling", label: "Animal Handling" },
                { key: "arcana", label: "Arcana" },
                { key: "athletics", label: "Athletics" },
                { key: "deception", label: "Deception" },
                { key: "history", label: "History" },
                { key: "insight", label: "Insight" },
                { key: "intimidation", label: "Intimidation" },
                { key: "investigation", label: "Investigation" },
                { key: "medicine", label: "Medicine" },
                { key: "nature", label: "Nature" },
                { key: "perception", label: "Perception" },
                { key: "performance", label: "Performance" },
                { key: "persuasion", label: "Persuasion" },
                { key: "religion", label: "Religion" },
                { key: "sleightOfHand", label: "Sleight of Hand" },
                { key: "stealth", label: "Stealth" },
                { key: "survival", label: "Survival" },
              ] as const
            ).map(({ key, label }) => {
              const val = character.skills[key] ?? 0;
              const isProficient = val !== 0;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-surface-800"
                >
                  <div className="flex items-center gap-2">
                    {isProficient && (
                      <span className="h-1 w-1 rounded-full bg-rogue-500" />
                    )}
                    <span
                      className={`text-xs ${
                        isProficient ? "font-medium text-surface-200" : "text-surface-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold ${
                      val >= 0 ? "text-rogue-400" : "text-warrior-400"
                    }`}
                  >
                    {val >= 0 ? "+" : ""}
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Features & Traits */}
      {character.features.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Features & Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {character.features.map((feat) => (
              <span
                key={feat}
                className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-400 ring-1 ring-accent-500/20"
              >
                {feat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Equipment */}
      {character.equipment.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Equipment
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {character.equipment.map((item) => (
              <div
                key={item}
                className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Currency */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">
          Currency
        </h2>
        <div className="grid grid-cols-5 gap-2 text-center">
          <CurrencyCell label="PP" value={character.currency.pp} color="gold" />
          <CurrencyCell label="GP" value={character.currency.gp} color="gold" />
          <CurrencyCell label="EP" value={character.currency.ep} color="surface" />
          <CurrencyCell label="SP" value={character.currency.sp} color="surface" />
          <CurrencyCell label="CP" value={character.currency.cp} color="surface" />
        </div>
      </section>

      {/* Backstory */}
      {character.backstory && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Backstory
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">
            {character.backstory}
          </p>
        </section>
      )}

      {/* Notes */}
      {character.notes && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-400 italic">
            {character.notes}
          </p>
        </section>
      )}

      {/* Speed + Proficiency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
          <p className="text-xs text-surface-400">Speed</p>
          <p className="text-lg font-bold text-surface-100">{character.speed} ft.</p>
        </div>
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
          <p className="text-xs text-surface-400">Proficiency</p>
          <p className="text-lg font-bold text-surface-100">
            +{character.proficiencyBonus}
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-surface-600 pb-8">
        Character Sheet · Arkla Campaign · Updated{" "}
        {new Date(character.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "warrior" | "mage" | "rogue";
}) {
  const colorMap = {
    warrior: "border-warrior-500/30 bg-warrior-500/10 text-warrior-400",
    mage: "border-mage-500/30 bg-mage-500/10 text-mage-400",
    rogue: "border-rogue-500/30 bg-rogue-500/10 text-rogue-400",
  };

  return (
    <div
      className={`rounded-xl border p-4 text-center ${colorMap[color]}`}
    >
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  );
}

function CurrencyCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gold" | "surface";
}) {
  const colorClass =
    color === "gold"
      ? "text-gold-400 bg-gold-500/10 border-gold-500/20"
      : "text-surface-300 bg-surface-800 border-surface-700";

  return (
    <div className={`rounded-lg border py-2 ${colorClass}`}>
      <p className="text-[10px] font-semibold uppercase opacity-60">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
