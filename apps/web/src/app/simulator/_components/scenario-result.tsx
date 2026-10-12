import { DamageComparisonChart } from '../../../components/charts/damage-comparison-chart';
import { TeamMemberContributionChart } from '../../../components/charts/team-member-contribution-chart';
import { Tag } from '../../../components/ui/badge';
import { Eyebrow, Inset } from '../../../components/ui/inset';
import { Note } from '../../../components/ui/note';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { DamageScenarioResponse } from '../../../lib/api';
import { formatDamage, formatSigned, formatStatSummary } from './simulator-format';

export const SCENARIO_CHART_HELP = {
  Base: 'Base: daño estimado del equipo antes de aplicar tus cambios de stats.',
  Simulado: 'Simulado: daño estimado luego de aplicar los deltas del escenario.',
};

const HINTS = [
  {
    label: 'Fórmula real',
    step: '01',
    caption: 'El daño se recalcula con factores multiplicativos, no con suma lineal.',
    accent: 'var(--gold)',
  },
  {
    label: 'Equipo',
    step: '02',
    caption: 'Mantén el equipo automático o fija compañeros concretos.',
    accent: 'var(--purple)',
  },
];

function AwaitingScenario() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {HINTS.map((hint) => (
          <StatTile
            key={hint.label}
            label={hint.label}
            value={hint.step}
            caption={hint.caption}
            accent={hint.accent}
          />
        ))}
      </div>
      <Note className="mt-3.5">
        El panel espera un escenario. Selecciona un personaje, fija el equipo si
        lo necesitas y define los stats finales para medir el impacto real sobre
        tu composición.
      </Note>
    </>
  );
}

function ScenarioReport({ scenario }: { scenario: DamageScenarioResponse }) {
  const isGain = scenario.deltaPercent >= 0;
  const { currentTeam, proposedTeam } = scenario.damageComparison;

  return (
    <div className="max-h-[78vh] space-y-3 overflow-y-auto pr-1">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Cambio estimado"
          value={
            <span className={isGain ? 'text-success' : 'text-danger'}>
              {formatSigned(scenario.deltaPercent)}%
            </span>
          }
          caption="daño del equipo"
          accent={isGain ? 'var(--green)' : 'var(--red)'}
        />
        <StatTile
          label="Daño base"
          value={formatDamage(scenario.baseTeamDamage)}
          caption="antes del ajuste"
          accent="var(--purple)"
        />
        <StatTile
          label="Daño simulado"
          value={formatDamage(scenario.simulatedTeamDamage)}
          caption="con los stats objetivo"
          accent="var(--cyan)"
        />
      </div>

      <Note>{scenario.summary}</Note>

      {scenario.teamContext ? (
        <Inset>
          <Eyebrow>
            Equipo {scenario.teamContext.mode === 'custom' ? 'personalizado' : 'automático'}
          </Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {scenario.teamContext.members
              .map((member) =>
                member.isTarget ? `${member.name} (objetivo)` : member.name,
              )
              .join(', ')}
          </p>
        </Inset>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Inset>
          <Eyebrow>Stats base</Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {formatStatSummary(scenario.statKeys, scenario.baseStats)}
          </p>
        </Inset>
        <Inset>
          <Eyebrow>Stats simuladas</Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {formatStatSummary(scenario.statKeys, scenario.simulatedStats)}
          </p>
        </Inset>
      </div>

      <DamageComparisonChart
        currentTotal={scenario.baseTeamDamage}
        proposedTotal={scenario.simulatedTeamDamage}
        currentLabel="Base"
        proposedLabel="Simulado"
        seriesName="Daño de escenario"
        helpTextByLabel={SCENARIO_CHART_HELP}
      />

      <TeamMemberContributionChart
        currentMembers={currentTeam.members}
        proposedMembers={proposedTeam.members}
      />
    </div>
  );
}

type ScenarioResultProps = {
  scenario: DamageScenarioResponse | null;
};

export function ScenarioResult({ scenario }: ScenarioResultProps) {
  return (
    <WindowPanel
      title="Salida del simulador"
      subtitle={
        scenario
          ? `Escenario activo sobre ${scenario.character.name}.`
          : 'Ejecuta una simulación para ver daño base, daño ajustado y contribución por miembro.'
      }
      action={<Tag>{scenario ? 'Simulado' : 'En espera'}</Tag>}
    >
      {scenario ? <ScenarioReport scenario={scenario} /> : <AwaitingScenario />}
    </WindowPanel>
  );
}
