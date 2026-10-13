'use client';

import { Badge } from '../../../../components/ui/badge';
import { Field } from '../../../../components/ui/field';
import { Textarea } from '../../../../components/ui/textarea';
import type { RelicSet } from '../../../../lib/api';
import { getRarityLabel } from '../../_components/admin-catalog-helpers';
import {
  CatalogListItem,
  EditorModeBadge,
  GameVersionField,
  NameField,
  RarityField,
  SlugField,
  SplashBadge,
  StatusField,
} from '../../_components/admin-catalog-parts';
import { EditorPanel } from '../../_components/admin-editor-panel';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../_components/admin-layout';
import { MediaSlotCard } from '../../_components/admin-media-slot-card';
import { AdminPage } from '../../_components/admin-page';
import { ResourceListPanel } from '../../_components/admin-resource-list';
import { useAdminMediaSlot } from '../../_components/use-admin-media-slot';
import {
  AdminResourceLabels,
  useAdminResource,
} from '../../_components/use-admin-resource';
import { buildRelicSetPayload, type RelicSetKind } from './relic-set-payload';

type KindCopy = {
  singular: string;
  plural: string;
  pageTitle: string;
  pageDescription: string;
  listTitle: string;
};

// Artefactos y ornamentos son el mismo modelo (relic set) filtrado por tipo.
const COPY: Record<RelicSetKind, KindCopy> = {
  ARTIFACT: {
    singular: 'artefacto',
    plural: 'artefactos',
    pageTitle: 'Gestión de artefactos',
    pageDescription: 'Administra sets de artefacto y deja listas sus imágenes.',
    listTitle: 'Artefactos',
  },
  ORNAMENT: {
    singular: 'ornamento',
    plural: 'ornamentos',
    pageTitle: 'Gestión de ornamentos',
    pageDescription: 'Administra sets de ornamento planar y deja listas sus imágenes.',
    listTitle: 'Ornamentos',
  },
};

function buildLabels({ singular, plural }: KindCopy): AdminResourceLabels {
  return {
    loadError: `No fue posible cargar los ${plural}.`,
    loadMoreError: `No fue posible cargar más ${plural}.`,
    created: 'Relic set creado.',
    updated: 'Relic set actualizado.',
    saveError: `No fue posible guardar el ${singular}.`,
    archived: 'Relic set archivado.',
    archiveError: `No fue posible archivar el ${singular}.`,
  };
}

const LABELS: Record<RelicSetKind, AdminResourceLabels> = {
  ARTIFACT: buildLabels(COPY.ARTIFACT),
  ORNAMENT: buildLabels(COPY.ORNAMENT),
};

function getSearchFields(relicSet: RelicSet) {
  return [relicSet.name, relicSet.slug, relicSet.status, String(relicSet.rarity)];
}

function RelicSetFields({ relicSet }: { relicSet: RelicSet | null }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NameField defaultValue={relicSet?.name} />
        <SlugField defaultValue={relicSet?.slug} />
        <RarityField defaultValue={relicSet?.rarity} />
        <GameVersionField defaultValue={relicSet?.gameVersion} />
        <StatusField defaultValue={relicSet?.status} />
      </div>

      <Field label="Bonus de 2 piezas">
        <Textarea
          name="twoPieceBonus"
          defaultValue={relicSet?.twoPieceBonus ?? ''}
          placeholder="Describe el bonus de dos piezas..."
          required
        />
      </Field>

      <Field
        label="Bonus de 4 piezas"
        hint="En ornamentos puedes dejarlo vacío si no aplica."
      >
        <Textarea
          name="fourPieceBonus"
          defaultValue={relicSet?.fourPieceBonus ?? ''}
          placeholder="Describe el bonus de cuatro piezas..."
        />
      </Field>
    </>
  );
}

type WorkspaceProps = {
  type: RelicSetKind;
  accessToken: string;
};

function RelicSetsWorkspace({ type, accessToken }: WorkspaceProps) {
  const copy = COPY[type];
  const resource = useAdminResource<RelicSet>({
    accessToken,
    path: '/admin/relic-sets',
    query: `type=${type}`,
    searchFields: getSearchFields,
    labels: LABELS[type],
  });
  const splashArt = useAdminMediaSlot({
    resource,
    slot: 'splash-art',
    labels: { uploaded: 'Splash art actualizado.', removed: 'Splash art eliminado.' },
  });
  const { selected } = resource;

  return (
    <section className={ADMIN_EDITOR_GRID_CLASSNAME}>
      <ResourceListPanel
        title={copy.listTitle}
        subtitle={`Catálogo editorial de ${copy.plural}.`}
        resource={resource}
        searchPlaceholder="Buscar por nombre, slug o rareza"
        emptyText={`No hay ${copy.plural} que coincidan con tu búsqueda.`}
        renderItem={(relicSet) => (
          <CatalogListItem
            record={relicSet}
            badges={
              <>
                <Badge variant="success">{getRarityLabel(relicSet.rarity)}</Badge>
                <SplashBadge record={relicSet} />
              </>
            }
            footnote={relicSet.twoPieceBonus}
          />
        )}
      />

      <div className="space-y-5">
        <EditorPanel
          title={selected ? selected.name : `Crear ${copy.singular}`}
          subtitle={
            selected ? `Edición del ${copy.singular}.` : `Nuevo ${copy.singular}.`
          }
          badge={<EditorModeBadge record={selected} />}
          formKey={selected?.id ?? 'new'}
          onSubmit={(formData) =>
            resource.save(() => buildRelicSetPayload(formData, type))
          }
          isSaving={resource.isSaving}
          saveLabel={`Guardar ${copy.singular}`}
          onReset={resource.clearSelection}
          onArchive={resource.archive}
          canArchive={Boolean(selected)}
        >
          <RelicSetFields relicSet={selected} />
        </EditorPanel>

        <MediaSlotCard
          key={`splash-${selected?.id ?? 'empty'}`}
          title="Splash art"
          emptyMessage={`Selecciona un ${copy.singular} para gestionar su imagen.`}
          item={selected}
          imageUrl={selected?.splashArtUrl}
          uploadButtonLabel="Subir splash art"
          media={splashArt}
        />
      </div>
    </section>
  );
}

export function RelicSetsPanel({ type }: { type: RelicSetKind }) {
  const copy = COPY[type];

  return (
    <AdminPage title={copy.pageTitle} description={copy.pageDescription}>
      {({ accessToken }) => <RelicSetsWorkspace type={type} accessToken={accessToken} />}
    </AdminPage>
  );
}
