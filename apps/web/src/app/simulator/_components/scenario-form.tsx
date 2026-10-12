import { CharacterVisualPicker } from '../../../components/characters/character-visual-picker';
import { StatFields } from '../../../components/characters/stat-fields';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CheckboxField } from '../../../components/ui/checkbox-field';
import { Combobox } from '../../../components/ui/combobox';
import { EmptyState, Eyebrow, Inset } from '../../../components/ui/inset';
import { Note } from '../../../components/ui/note';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { Character, UserCharacter } from '../../../lib/api';
import type { DamageScenario } from './use-damage-scenario';

function toTeammateOption({ character }: UserCharacter) {
  return {
    value: String(character.id),
    label: `${character.name} - ${character.element} / ${character.path}`,
    searchText: [character.name, ...character.aliases.map((alias) => alias.alias)].join(
      ' ',
    ),
  };
}

function TeamSelector({ scenario }: { scenario: DamageScenario }) {
  return (
    <Inset className="space-y-3 p-3">
      <CheckboxField
        checked={scenario.useCustomTeam}
        onChange={scenario.setUseCustomTeam}
        label="Usar equipo personalizado para la simulación"
        hint="Sin esta opción el equipo se elige automáticamente. Si fijas solo 1 o 2 compañeros, el motor completa hasta 4 miembros priorizando sinergia."
      />

      {scenario.useCustomTeam ? (
        <div className="grid gap-3 md:grid-cols-3">
          {scenario.teammateSlots.map((slotValue, index) => (
            <div key={index} className="space-y-1">
              <Eyebrow>Compañero {index + 1}</Eyebrow>
              <Combobox
                className="w-full"
                value={slotValue}
                onValueChange={(nextValue) =>
                  scenario.changeTeammate(index, nextValue)
                }
                placeholder="Sin seleccionar"
                searchPlaceholder="Busca un compañero por nombre o alias"
                emptyText="No hay compañeros disponibles."
                options={scenario.teammateOptions(index).map(toTeammateOption)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </Inset>
  );
}

type ScenarioFormProps = {
  rosterCharacters: Character[];
  scenario: DamageScenario;
};

export function ScenarioForm({ rosterCharacters, scenario }: ScenarioFormProps) {
  const { entry, isSubmitting } = scenario;

  return (
    <WindowPanel
      title="Escenario controlado"
      subtitle="Define los stats finales y mide su impacto con contexto de equipo."
      action={
        <Badge variant={entry ? 'brand' : 'neutral'}>
          {entry?.character.name ?? 'Sin personaje'}
        </Badge>
      }
    >
      {rosterCharacters.length === 0 ? (
        <EmptyState>
          Agrega personajes a tu cuenta para habilitar simulaciones de stats.
        </EmptyState>
      ) : (
        <form
          className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
          onSubmit={scenario.submit}
        >
          <div className="space-y-1">
            <Eyebrow>Personaje a simular</Eyebrow>
            <CharacterVisualPicker
              characters={rosterCharacters}
              value={scenario.characterId}
              onValueChange={scenario.selectCharacter}
              searchPlaceholder="Busca en tu roster por nombre o alias"
              emptyText="No hay personajes de tu roster que coincidan."
            />
          </div>

          <TeamSelector scenario={scenario} />

          <div className="space-y-2">
            <Eyebrow>Stats finales objetivo</Eyebrow>
            <StatFields
              statKeys={scenario.statKeys}
              values={scenario.statInputs}
              onChange={scenario.changeStat}
            />
          </div>

          <Note>
            Ingresa los stats finales, no incrementos. El motor los convierte en
            cambios y recalcula el daño con fórmula multiplicativa: Base DMG,
            DMG%, DEF, RES, DMG Taken y Toughness.
          </Note>

          <Button type="submit" disabled={isSubmitting || !entry}>
            {isSubmitting ? 'Simulando...' : 'Simular escenario'}
          </Button>
        </form>
      )}
    </WindowPanel>
  );
}
