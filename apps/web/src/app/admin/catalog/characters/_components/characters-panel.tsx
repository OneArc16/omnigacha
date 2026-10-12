'use client';

import { Badge } from '../../../../../components/ui/badge';
import { Field } from '../../../../../components/ui/field';
import { Input } from '../../../../../components/ui/input';
import type { Character } from '../../../../../lib/api';
import {
  getRarityLabel,
  readCatalogBasePayload,
  readOptionalField,
} from '../../../_components/admin-catalog-helpers';
import {
  CatalogListItem,
  EditorModeBadge,
  GameVersionField,
  NameField,
  RarityField,
  SlugField,
  StatusField,
} from '../../../_components/admin-catalog-parts';
import { EditorPanel } from '../../../_components/admin-editor-panel';
import { readNumber, readRequiredText } from '../../../_components/admin-form-utils';
import {
  ADMIN_EDITOR_GRID_CLASSNAME,
  ADMIN_MEDIA_GRID_CLASSNAME,
} from '../../../_components/admin-layout';
import { MediaSlotCard } from '../../../_components/admin-media-slot-card';
import { AdminPage } from '../../../_components/admin-page';
import { ResourceListPanel } from '../../../_components/admin-resource-list';
import { useAdminMediaSlot } from '../../../_components/use-admin-media-slot';
import {
  AdminResourceLabels,
  useAdminResource,
} from '../../../_components/use-admin-resource';

const LABELS: AdminResourceLabels = {
  loadError: 'No fue posible cargar los personajes.',
  loadMoreError: 'No fue posible cargar más personajes.',
  created: 'Personaje creado.',
  updated: 'Personaje actualizado.',
  saveError: 'No fue posible guardar el personaje.',
  archived: 'Personaje archivado.',
  archiveError: 'No fue posible archivar el personaje.',
};

type BaseStatField = {
  name: keyof Pick<
    Character,
    'baseHp' | 'baseAtk' | 'baseDef' | 'baseCritRate' | 'baseCritDamage' | 'baseSpeed'
  >;
  label: string;
  required: boolean;
  integer: boolean;
};

const BASE_STAT_FIELDS: BaseStatField[] = [
  { name: 'baseHp', label: 'HP base', required: false, integer: true },
  { name: 'baseAtk', label: 'ATK base', required: true, integer: true },
  { name: 'baseDef', label: 'DEF base', required: false, integer: true },
  { name: 'baseCritRate', label: 'Prob. CRIT', required: true, integer: false },
  { name: 'baseCritDamage', label: 'Daño CRIT', required: true, integer: false },
  { name: 'baseSpeed', label: 'Velocidad base', required: true, integer: true },
];

function getSearchFields(character: Character) {
  return [
    character.name,
    character.slug,
    character.element,
    character.path,
    character.role,
    character.status,
  ];
}

function buildCharacterPayload(formData: FormData) {
  const baseStats = Object.fromEntries(
    BASE_STAT_FIELDS.map(({ name, label, required, integer }) => [
      name,
      readNumber(formData, name, label, { required, integer, min: 0 }),
    ]),
  );

  return {
    ...readCatalogBasePayload(formData),
    element: readRequiredText(formData, 'element', 'Elemento'),
    path: readRequiredText(formData, 'path', 'Camino'),
    role: readRequiredText(formData, 'role', 'Rol'),
    ...baseStats,
    ...readOptionalField(formData, 'gameVersion'),
  };
}

function CharacterFields({ character }: { character: Character | null }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NameField defaultValue={character?.name} />
        <SlugField defaultValue={character?.slug} />
        <Field label="Elemento">
          <Input
            name="element"
            defaultValue={character?.element ?? ''}
            placeholder="Fire, Ice, Quantum..."
            required
          />
        </Field>
        <Field label="Camino">
          <Input
            name="path"
            defaultValue={character?.path ?? ''}
            placeholder="Destruction, Harmony..."
            required
          />
        </Field>
        <Field label="Rol">
          <Input
            name="role"
            defaultValue={character?.role ?? ''}
            placeholder="DPS, support..."
            required
          />
        </Field>
        <RarityField defaultValue={character?.rarity} />
        <GameVersionField defaultValue={character?.gameVersion} />
        <StatusField defaultValue={character?.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BASE_STAT_FIELDS.map(({ name, label, required, integer }) => (
          <Field key={name} label={label}>
            <Input
              name={name}
              type="number"
              min={0}
              step={integer ? 1 : '0.01'}
              defaultValue={character?.[name] ?? 0}
              required={required}
            />
          </Field>
        ))}
      </div>
    </>
  );
}

function CharactersWorkspace({ accessToken }: { accessToken: string }) {
  const resource = useAdminResource<Character>({
    accessToken,
    path: '/admin/characters',
    searchFields: getSearchFields,
    labels: LABELS,
  });
  const splashArt = useAdminMediaSlot({
    resource,
    slot: 'splash-art',
    labels: {
      uploaded: 'Splash art de personaje actualizado.',
      removed: 'Splash art eliminado.',
    },
  });
  const portrait = useAdminMediaSlot({
    resource,
    slot: 'portrait',
    labels: { uploaded: 'Retrato de personaje actualizado.', removed: 'Retrato eliminado.' },
  });
  const { selected } = resource;

  return (
    <section className={ADMIN_EDITOR_GRID_CLASSNAME}>
      <ResourceListPanel
        title="Personajes"
        subtitle="Catálogo editorial de personajes."
        resource={resource}
        searchPlaceholder="Buscar por nombre, slug, rol o elemento"
        emptyText="No hay personajes que coincidan con tu búsqueda."
        renderItem={(character) => (
          <CatalogListItem
            record={character}
            badges={
              <>
                <Badge variant="brand">{character.element}</Badge>
                <Badge variant="outline">{character.path}</Badge>
                <Badge variant="neutral">{character.role}</Badge>
                <Badge variant="success">{getRarityLabel(character.rarity)}</Badge>
              </>
            }
            footnote={`ATK ${character.baseAtk} · DEF ${character.baseDef} · SPD ${character.baseSpeed}`}
          />
        )}
      />

      <div className="space-y-5">
        <EditorPanel
          title={selected ? selected.name : 'Crear personaje'}
          subtitle={selected ? 'Edición de la ficha del personaje.' : 'Nuevo personaje.'}
          badge={<EditorModeBadge record={selected} />}
          formKey={selected?.id ?? 'new'}
          onSubmit={(formData) => resource.save(() => buildCharacterPayload(formData))}
          isSaving={resource.isSaving}
          saveLabel="Guardar personaje"
          onReset={resource.clearSelection}
          onArchive={resource.archive}
          canArchive={Boolean(selected)}
          note="Las imágenes se suben en los paneles de abajo para no mezclar media con los datos del personaje."
        >
          <CharacterFields character={selected} />
        </EditorPanel>

        <div className={ADMIN_MEDIA_GRID_CLASSNAME}>
          <MediaSlotCard
            key={`splash-${selected?.id ?? 'empty'}`}
            title="Splash art"
            emptyMessage="Selecciona un personaje para subir o quitar su splash art."
            item={selected}
            imageUrl={selected?.splashArtUrl}
            uploadButtonLabel="Subir splash art"
            media={splashArt}
          />
          <MediaSlotCard
            key={`portrait-${selected?.id ?? 'empty'}`}
            title="Retrato de catálogo"
            emptyMessage="Selecciona un personaje para subir o quitar su retrato."
            item={selected}
            imageUrl={selected?.portraitUrl}
            uploadButtonLabel="Subir retrato"
            previewClassName="aspect-[3/4] max-w-[220px]"
            hint="Se usa en roster, recomendación, simulación y catálogo visual. Límite de 10 MB."
            media={portrait}
          />
        </div>
      </div>
    </section>
  );
}

export function CharactersPanel() {
  return (
    <AdminPage
      title="Gestión de personajes"
      description="Mantén el catálogo editorial y prepara splash art y retratos para el front."
    >
      {({ accessToken }) => <CharactersWorkspace accessToken={accessToken} />}
    </AdminPage>
  );
}
