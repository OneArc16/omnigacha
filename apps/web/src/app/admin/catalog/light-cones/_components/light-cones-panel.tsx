'use client';

import { Badge } from '../../../../../components/ui/badge';
import { Field } from '../../../../../components/ui/field';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import type { LightCone } from '../../../../../lib/api';
import { getRarityLabel } from '../../../_components/admin-catalog-helpers';
import {
  CatalogListItem,
  EditorModeBadge,
  NameField,
  RarityField,
  SlugField,
  SplashBadge,
  StatusField,
} from '../../../_components/admin-catalog-parts';
import { EditorPanel } from '../../../_components/admin-editor-panel';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../../_components/admin-layout';
import { MediaSlotCard } from '../../../_components/admin-media-slot-card';
import { AdminPage } from '../../../_components/admin-page';
import { ResourceListPanel } from '../../../_components/admin-resource-list';
import { useAdminMediaSlot } from '../../../_components/use-admin-media-slot';
import {
  AdminResourceLabels,
  useAdminResource,
} from '../../../_components/use-admin-resource';
import { buildLightConePayload } from './light-cone-payload';

const LABELS: AdminResourceLabels = {
  loadError: 'No fue posible cargar los conos de luz.',
  loadMoreError: 'No fue posible cargar más conos de luz.',
  created: 'Cono de luz creado.',
  updated: 'Cono actualizado.',
  saveError: 'No fue posible guardar el cono de luz.',
  archived: 'Cono archivado.',
  archiveError: 'No fue posible archivar el cono de luz.',
};

function getSearchFields(lightCone: LightCone) {
  return [
    lightCone.name,
    lightCone.slug,
    lightCone.path,
    lightCone.status,
    String(lightCone.rarity),
  ];
}

function LightConeFields({ lightCone }: { lightCone: LightCone | null }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NameField defaultValue={lightCone?.name} />
        <SlugField defaultValue={lightCone?.slug} />
        <Field label="Camino">
          <Input
            name="path"
            defaultValue={lightCone?.path ?? ''}
            placeholder="Harmony, Hunt..."
            required
          />
        </Field>
        <RarityField defaultValue={lightCone?.rarity} />
        <StatusField defaultValue={lightCone?.status} />
      </div>

      <Field
        label="Descripción del efecto"
        hint="Opcional, pero recomendado para completar la ficha del objeto."
      >
        <Textarea
          name="effectDescription"
          defaultValue={lightCone?.effectDescription ?? ''}
          placeholder="Describe el efecto principal del cono..."
        />
      </Field>
    </>
  );
}

function LightConesWorkspace({ accessToken }: { accessToken: string }) {
  const resource = useAdminResource<LightCone>({
    accessToken,
    path: '/admin/light-cones',
    searchFields: getSearchFields,
    labels: LABELS,
  });
  const splashArt = useAdminMediaSlot({
    resource,
    slot: 'splash-art',
    labels: {
      uploaded: 'Splash art del cono actualizado.',
      removed: 'Splash art eliminado.',
    },
  });
  const { selected } = resource;

  return (
    <section className={ADMIN_EDITOR_GRID_CLASSNAME}>
      <ResourceListPanel
        title="Conos de luz"
        subtitle="Catálogo editorial de conos."
        resource={resource}
        searchPlaceholder="Buscar por nombre, slug, camino o rareza"
        emptyText="No hay conos de luz que coincidan con tu búsqueda."
        renderItem={(lightCone) => (
          <CatalogListItem
            record={lightCone}
            badges={
              <>
                <Badge variant="brand">{lightCone.path}</Badge>
                <Badge variant="success">{getRarityLabel(lightCone.rarity)}</Badge>
                <SplashBadge record={lightCone} />
              </>
            }
            footnote={lightCone.effectDescription}
          />
        )}
      />

      <div className="space-y-5">
        <EditorPanel
          title={selected ? selected.name : 'Crear cono de luz'}
          subtitle={selected ? 'Edición de la ficha del cono.' : 'Nuevo cono de luz.'}
          badge={<EditorModeBadge record={selected} />}
          formKey={selected?.id ?? 'new'}
          onSubmit={(formData) => resource.save(() => buildLightConePayload(formData))}
          isSaving={resource.isSaving}
          saveLabel="Guardar cono"
          onReset={resource.clearSelection}
          onArchive={resource.archive}
          canArchive={Boolean(selected)}
        >
          <LightConeFields lightCone={selected} />
        </EditorPanel>

        <MediaSlotCard
          key={`splash-${selected?.id ?? 'empty'}`}
          title="Splash art"
          emptyMessage="Selecciona un cono de luz para gestionar su imagen."
          item={selected}
          imageUrl={selected?.splashArtUrl}
          uploadButtonLabel="Subir splash art"
          media={splashArt}
        />
      </div>
    </section>
  );
}

export function LightConesPanel() {
  return (
    <AdminPage
      title="Gestión de conos de luz"
      description="Mantén el catálogo de conos listo para el front y para futuras fichas visuales."
    >
      {({ accessToken }) => <LightConesWorkspace accessToken={accessToken} />}
    </AdminPage>
  );
}
