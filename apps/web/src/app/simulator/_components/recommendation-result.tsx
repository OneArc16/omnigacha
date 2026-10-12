import { DamageComparisonChart } from '../../../components/charts/damage-comparison-chart';
import { ScoreBreakdownChart } from '../../../components/charts/score-breakdown-chart';
import { TeamMemberContributionChart } from '../../../components/charts/team-member-contribution-chart';
import { RecommendationSummaryCard } from '../../../components/recommendations/recommendation-summary-card';
import { Tag } from '../../../components/ui/badge';
import { Eyebrow, Inset } from '../../../components/ui/inset';
import { Note } from '../../../components/ui/note';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { RecommendationResponse } from '../../../lib/api';
import {
  formatDamage,
  formatSigned,
  formatStatSummary,
  TARGET_STATS_SOURCE_LABEL,
} from './simulator-format';

const STEPS = [
  {
    label: 'Objetivo',
    step: '01',
    caption: 'Selecciona el personaje que quieres evaluar.',
    accent: 'var(--gold)',
  },
  {
    label: 'Contexto',
    step: '02',
    caption: 'Ajusta stats manuales si buscas un build real.',
    accent: 'var(--purple)',
  },
  {
    label: 'Resultado',
    step: '03',
    caption: 'Obtén puntaje, delta de daño y sinergias.',
    accent: 'var(--cyan)',
  },
];

const CHART_GUIDE = [
  {
    title: 'Daño',
    text: 'Actual es el daño estimado de tu mejor equipo de hoy; Propuesto, el del equipo al incluir al objetivo.',
  },
  {
    title: 'Puntaje',
    text: 'Cada barra es el aporte ponderado de un factor: daño, sinergia con tu roster, equipos compatibles, necesidad de rol, inversión disponible y valor para la cuenta.',
  },
  {
    title: 'Contribución',
    text: 'Cada etiqueta es un miembro del equipo final; se compara su daño en el equipo actual frente al propuesto.',
  },
];

function AwaitingRecommendation() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <StatTile
            key={step.label}
            label={step.label}
            value={step.step}
            caption={step.caption}
            accent={step.accent}
          />
        ))}
      </div>
      <Note className="mt-3.5">
        Aún no hay recomendación generada. El motor comparará sinergia, daño,
        necesidad de rol y balance del equipo para el objetivo que elijas.
      </Note>
    </>
  );
}

function RecommendationReport({ result }: { result: RecommendationResponse }) {
  const { recommendation, context } = result;
  const { currentTeam, proposedTeam } = context.damageComparison;

  return (
    <div className="max-h-[78vh] space-y-3 overflow-y-auto pr-1">
      <RecommendationSummaryCard
        eyebrow="Veredicto"
        name={recommendation.targetCharacter}
        character={context.targetCharacter}
        level={recommendation.level}
        score={recommendation.score}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Delta estimado"
          value={`${formatSigned(recommendation.estimatedDeltaDmg, 1)}%`}
          caption="cambio de daño del equipo"
        />
        <StatTile
          label="Daño actual"
          value={formatDamage(currentTeam.totalDamage)}
          caption="mejor equipo de hoy"
          accent="var(--purple)"
        />
        <StatTile
          label="Daño propuesto"
          value={formatDamage(proposedTeam.totalDamage)}
          caption="equipo con el objetivo"
          accent="var(--cyan)"
        />
      </div>

      <Note>{recommendation.explanation}</Note>

      {context.appliedTargetStats ? (
        <Inset>
          <Eyebrow>Stats objetivo usados</Eyebrow>
          <p className="mt-2 text-sm text-[var(--ink-700)]">
            {formatStatSummary(
              context.appliedTargetStats.statKeys,
              context.appliedTargetStats.stats,
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Fuente: {TARGET_STATS_SOURCE_LABEL[context.appliedTargetStats.source]}.
          </p>
        </Inset>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-2">
        <DamageComparisonChart
          currentTotal={currentTeam.totalDamage}
          proposedTotal={proposedTeam.totalDamage}
        />
        <ScoreBreakdownChart breakdown={context.scoringBreakdown} />
      </div>

      <TeamMemberContributionChart
        currentMembers={currentTeam.members}
        proposedMembers={proposedTeam.members}
      />

      <Inset>
        <Eyebrow>Cómo leer las gráficas</Eyebrow>
        <dl className="mt-2 grid gap-3 text-xs leading-5 text-muted xl:grid-cols-3">
          {CHART_GUIDE.map((item) => (
            <div key={item.title}>
              <dt className="font-semibold text-ink">{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </Inset>

      <Inset>
        <Eyebrow>Top sinergias detectadas</Eyebrow>
        {context.topSynergies.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Sin sinergias directas detectadas.
          </p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)] marker:text-gold">
            {context.topSynergies.map((synergy) => (
              <li key={synergy}>{synergy}</li>
            ))}
          </ul>
        )}
      </Inset>
    </div>
  );
}

type RecommendationResultProps = {
  result: RecommendationResponse | null;
};

export function RecommendationResult({ result }: RecommendationResultProps) {
  return (
    <WindowPanel
      title="Resultado de recomendación"
      subtitle={
        result
          ? `Análisis activo sobre ${result.recommendation.targetCharacter}.`
          : 'Genera una recomendación para abrir el tablero analítico.'
      }
      action={<Tag>{result ? 'Analizado' : 'En espera'}</Tag>}
    >
      {result ? <RecommendationReport result={result} /> : <AwaitingRecommendation />}
    </WindowPanel>
  );
}
