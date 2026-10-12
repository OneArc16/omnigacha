import type { CharacterStatKey } from "../../lib/api";
import {
  CHARACTER_STAT_UI,
  CharacterStatsFormValues,
} from "../../lib/character-stats";
import { Input } from "../ui/input";

type StatFieldsProps = {
  statKeys: CharacterStatKey[];
  values: CharacterStatsFormValues;
  onChange: (statKey: CharacterStatKey, value: string) => void;
  required?: boolean;
  className?: string;
};

/** Rejilla de inputs numéricos para los stats visibles de un personaje. */
export function StatFields({
  statKeys,
  values,
  onChange,
  required = false,
  className = "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
}: StatFieldsProps) {
  return (
    <div className={className}>
      {statKeys.map((statKey) => {
        const config = CHARACTER_STAT_UI[statKey];

        return (
          <label
            key={statKey}
            className="space-y-1 text-xs font-medium text-[var(--ink-700)]"
          >
            {config.label}
            <Input
              type="number"
              min={config.min}
              step={config.step}
              value={values[statKey]}
              onChange={(event) => onChange(statKey, event.target.value)}
              placeholder={config.placeholder}
              required={required}
            />
          </label>
        );
      })}
    </div>
  );
}
