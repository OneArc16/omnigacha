import { CharacterPortrait } from '../../../components/characters/character-portrait';
import { UserCharacterForm } from '../../../components/characters/user-character-form';
import { WORKSPACE_ROSTER_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/inset';
import { Skeleton } from '../../../components/ui/skeleton';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { UserCharacter } from '../../../lib/api';
import type { Roster } from './use-roster';
import {
  formatLightConeSummary,
  formatRosterSummary,
} from './user-character-payload';

type RosterEntryProps = {
  entry: UserCharacter;
  isEditing: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function RosterEntry({
  entry,
  isEditing,
  isDeleting,
  onEdit,
  onDelete,
}: RosterEntryProps) {
  return (
    <article
      className={`border p-4 transition ${
        isEditing
          ? 'border-gold/60 bg-gold/[0.05]'
          : 'border-line-soft surface-inset hover:border-[var(--line-strong)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <CharacterPortrait character={entry.character} size="sm" />
          <div className="space-y-2">
            <p className="text-base font-semibold text-ink">
              {entry.character.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="brand">{entry.character.element}</Badge>
              <Badge variant="outline">{entry.character.path}</Badge>
              <Badge variant="neutral">{entry.character.role}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium tracking-wide text-[var(--ink-700)]">
        LVL {entry.level} · E{entry.eidolon} · {formatRosterSummary(entry)}
      </p>
      <p className="mt-2 text-xs text-muted">{formatLightConeSummary(entry)}</p>
    </article>
  );
}

function RosterList({ roster }: { roster: Roster }) {
  if (roster.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[116px] w-full" />
        <Skeleton className="h-[116px] w-full" />
        <Skeleton className="h-[116px] w-full" />
      </div>
    );
  }

  if (roster.characters.length === 0) {
    return (
      <EmptyState>Aún no tienes personajes registrados.</EmptyState>
    );
  }

  return (
    <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
      {roster.characters.map((entry) => (
        <RosterEntry
          key={entry.id}
          entry={entry}
          isEditing={roster.editing?.entry.id === entry.id}
          isDeleting={roster.deletingId === entry.id}
          onEdit={() => roster.startEditing(entry)}
          onDelete={() => roster.remove(entry)}
        />
      ))}
    </div>
  );
}

export function RosterView({ roster }: { roster: Roster }) {
  const { catalog, lightCones, create, editing } = roster;
  const total = roster.characters.length;

  return (
    <section className={`mt-1 ${WORKSPACE_ROSTER_GRID_CLASSNAME}`}>
      <WindowPanel
        title={editing ? 'Editar personaje' : 'Agregar personaje'}
        subtitle={
          editing
            ? `Actualiza ${editing.entry.character.name} sin salir del panel.`
            : 'Selecciona un personaje base y guarda una versión propia.'
        }
      >
        {editing ? (
          <UserCharacterForm
            catalog={catalog}
            lightCones={lightCones}
            selectedCharacter={editing.entry.character}
            values={editing.values}
            onSubmit={editing.submit}
            onFieldChange={editing.changeField}
            onStatFieldChange={editing.changeStat}
            submitLabel="Guardar cambios"
            isSubmitting={editing.isSubmitting}
            showStatsByDefault
            disableCharacterSelect
            characterPath={editing.entry.character.path}
            onCancel={editing.cancel}
          />
        ) : (
          <UserCharacterForm
            catalog={catalog}
            lightCones={lightCones}
            selectedCharacter={create.selectedCharacter}
            values={create.values}
            onSubmit={create.submit}
            onFieldChange={create.changeField}
            onStatFieldChange={create.changeStat}
            submitLabel="Agregar a mi cuenta"
            isSubmitting={create.isSubmitting}
            showManualToggle
            useManualStats={create.useManualStats}
            onUseManualStatsChange={create.toggleManualStats}
            characterPath={create.selectedCharacter?.path ?? null}
          />
        )}
      </WindowPanel>

      <WindowPanel
        title="Roster guardado"
        subtitle="Todo tu inventario visible en una sola ventana."
        action={
          <Badge variant="neutral">
            {total} {total === 1 ? 'personaje' : 'personajes'}
          </Badge>
        }
      >
        <RosterList roster={roster} />
      </WindowPanel>
    </section>
  );
}
