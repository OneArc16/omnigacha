'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { WindowPanel } from '../../../../components/ui/window-panel';
import { apiRequest, CursorPage, RelicSet } from '../../../../lib/api';
import { AdminAccessGate } from '../../_components/admin-access-gate';
import {
  catalogStatusVariant,
  getRarityLabel,
  getStatusBadgeText,
} from '../../_components/admin-catalog-helpers';
import { CatalogThumb } from '../../_components/admin-catalog-thumb';
import { EntityList } from '../../_components/admin-entity-list';
import { Field, SELECT_CLASSNAME } from '../../_components/admin-form-fields';
import {
  readNumber,
  readOptionalText,
  readRequiredText,
  readText,
} from '../../_components/admin-form-utils';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../_components/admin-layout';
import { MediaSlotCard } from '../../_components/admin-media-slot-card';
import { matchesQuery, upsertById } from '../../_components/admin-utils';

const PAGE_SIZE = 25;

type RelicSetKind = RelicSet['type'];

const COPY: Record<
  RelicSetKind,
  {
    singular: string;
    panelTitle: string;
    panelSubtitle: string;
    searchPlaceholder: string;
    emptyText: string;
    createTitle: string;
    splashTitle: string;
    splashEmptyMessage: string;
  }
> = {
  ARTIFACT: {
    singular: 'artefacto',
    panelTitle: 'Gestión de artefactos',
    panelSubtitle: 'Administra sets de artefacto y deja listas sus imágenes.',
    searchPlaceholder: 'Buscar por nombre, slug o rareza',
    emptyText: 'No hay artefactos que coincidan con tu búsqueda.',
    createTitle: 'Crear artefacto',
    splashTitle: 'Splash art de artefacto',
    splashEmptyMessage: 'Selecciona un artefacto para gestionar su imagen.',
  },
  ORNAMENT: {
    singular: 'ornamento',
    panelTitle: 'Gestión de ornamentos',
    panelSubtitle:
      'Administra sets de ornamento planar y deja listas sus imágenes.',
    searchPlaceholder: 'Buscar por nombre, slug o rareza',
    emptyText: 'No hay ornamentos que coincidan con tu búsqueda.',
    createTitle: 'Crear ornamento',
    splashTitle: 'Splash art de ornamento',
    splashEmptyMessage: 'Selecciona un ornamento para gestionar su imagen.',
  },
};

export function RelicSetsPanel({ type }: { type: RelicSetKind }) {
  const copy = COPY[type];

  return (
    <AdminAccessGate
      title={copy.panelTitle}
      subtitle="Necesitas iniciar sesión como administrador para gestionar el catálogo."
    >
      {({ accessToken }) => <RelicSetsWorkspace type={type} accessToken={accessToken} />}
    </AdminAccessGate>
  );
}

function RelicSetsWorkspace({
  type,
  accessToken,
}: {
  type: RelicSetKind;
  accessToken: string;
}) {
  const copy = COPY[type];

  const [relicSets, setRelicSets] = useState<RelicSet[]>([]);
  const [relicSetsNextCursor, setRelicSetsNextCursor] = useState<number | null>(
    null,
  );

  const [isLoadingRelicSets, setIsLoadingRelicSets] = useState(true);
  const [isLoadingMoreRelicSets, setIsLoadingMoreRelicSets] = useState(false);
  const [isSavingRelicSet, setIsSavingRelicSet] = useState(false);
  const [isUploadingSplashArt, setIsUploadingSplashArt] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoadingRelicSets(true);
      setLoadError('');

      try {
        const page = await apiRequest<CursorPage<RelicSet>>(
          `/admin/relic-sets?type=${type}&limit=${PAGE_SIZE}`,
          { token: accessToken },
        );

        if (!active) return;

        setRelicSets(page.items);
        setRelicSetsNextCursor(page.nextCursor);
      } catch (error) {
        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : `No fue posible cargar los ${copy.singular}s.`,
        );
      } finally {
        if (active) {
          setIsLoadingRelicSets(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, type, copy.singular]);

  async function loadMoreRelicSets() {
    if (relicSetsNextCursor === null) return;

    setIsLoadingMoreRelicSets(true);
    try {
      const page = await apiRequest<CursorPage<RelicSet>>(
        `/admin/relic-sets?type=${type}&limit=${PAGE_SIZE}&cursor=${relicSetsNextCursor}`,
        { token: accessToken },
      );

      setRelicSets((current) => [...current, ...page.items]);
      setRelicSetsNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `No fue posible cargar más ${copy.singular}s.`,
      );
    } finally {
      setIsLoadingMoreRelicSets(false);
    }
  }

  const filteredRelicSets = useMemo(
    () =>
      relicSets.filter((relicSet) =>
        matchesQuery(
          [relicSet.name, relicSet.slug, relicSet.status, relicSet.rarity.toString()],
          search,
        ),
      ),
    [relicSets, search],
  );

  const selectedRecord =
    relicSets.find((relicSet) => relicSet.id === selectedId) ?? null;
  const selectedMode = selectedRecord ? 'Edición' : copy.createTitle;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingRelicSet(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        type,
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        twoPieceBonus: readRequiredText(formData, 'twoPieceBonus', 'Bonus de 2 piezas'),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const fourPieceBonus = readOptionalText(formData, 'fourPieceBonus');
      const gameVersion = readOptionalText(formData, 'gameVersion');

      if (slug) {
        payload.slug = slug;
      }
      if (fourPieceBonus) {
        payload.fourPieceBonus = fourPieceBonus;
      }
      if (gameVersion) {
        payload.gameVersion = gameVersion;
      }

      const response = selectedRecord
        ? await apiRequest<RelicSet>(`/admin/relic-sets/${selectedRecord.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<RelicSet>('/admin/relic-sets', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setRelicSets((current) => upsertById(current, response));
      setSelectedId(response.id);
      toast.success(selectedRecord ? 'Relic set actualizado.' : 'Relic set creado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el relic set.',
      );
    } finally {
      setIsSavingRelicSet(false);
    }
  }

  async function handleArchive() {
    if (!selectedRecord) return;

    const shouldArchive = window.confirm(`Archivar a ${selectedRecord.name}?`);
    if (!shouldArchive) return;

    setIsSavingRelicSet(true);

    try {
      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}`,
        { method: 'DELETE', token: accessToken },
      );

      setRelicSets((current) => upsertById(current, response));
      setSelectedId(response.id);
      toast.success('Relic set archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el relic set.',
      );
    } finally {
      setIsSavingRelicSet(false);
    }
  }

  async function handleSplashUpload(formData: FormData) {
    if (!selectedRecord) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}/splash-art`,
        { method: 'POST', token: accessToken, body: payload },
      );

      setRelicSets((current) => upsertById(current, response));
      setSelectedId(response.id);
      toast.success('Splash art actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleSplashRemove() {
    if (!selectedRecord?.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}/splash-art`,
        { method: 'DELETE', token: accessToken },
      );

      setRelicSets((current) => upsertById(current, response));
      setSelectedId(response.id);
      toast.success('Splash art eliminado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la imagen.',
      );
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  return (
    <WindowPanel
      title={copy.panelTitle}
      subtitle={copy.panelSubtitle}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{filteredRelicSets.length} visibles</Badge>
          <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
            Nuevo
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {loadError ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {loadError}
          </div>
        ) : null}

        <div className={ADMIN_EDITOR_GRID_CLASSNAME}>
          <div>
            <EntityList
              items={filteredRelicSets}
              selectedId={selectedId}
              onSelect={setSelectedId}
              search={search}
              onSearch={setSearch}
              searchPlaceholder={copy.searchPlaceholder}
              emptyText={
                isLoadingRelicSets
                  ? `Cargando ${copy.singular}s...`
                  : copy.emptyText
              }
              hasMore={relicSetsNextCursor !== null}
              onLoadMore={() => {
                void loadMoreRelicSets();
              }}
              isLoadingMore={isLoadingMoreRelicSets}
              renderItem={(relicSet) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={relicSet.splashArtUrl}
                    alt={relicSet.name}
                    placeholder={relicSet.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {relicSet.name}
                      </span>
                      <Badge variant={catalogStatusVariant(relicSet.status)}>
                        {getStatusBadgeText(relicSet.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {relicSet.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="success">{getRarityLabel(relicSet.rarity)}</Badge>
                      {relicSet.splashArtUrl ? (
                        <Badge variant="success">Splash</Badge>
                      ) : (
                        <Badge variant="warning">Sin splash</Badge>
                      )}
                    </div>
                    <p className="pt-1 text-[11px] text-[var(--ink-500)] line-clamp-2">
                      {relicSet.twoPieceBonus}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedRecord?.id ?? 'new'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedRecord ? selectedRecord.name : copy.createTitle}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    Un solo modelo para artefactos y ornamentos reduce código
                    duplicado y mantiene la edición consistente.
                  </p>
                </div>
                {selectedRecord ? (
                  <Badge variant={catalogStatusVariant(selectedRecord.status)}>
                    {getStatusBadgeText(selectedRecord.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedRecord?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. El backend puede generarlo automáticamente."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedRecord?.slug ?? ''}
                    placeholder="slug-del-set"
                  />
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedRecord?.rarity ?? 5}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </Field>
                <Field label="Versión del juego">
                  <Input
                    name="gameVersion"
                    defaultValue={selectedRecord?.gameVersion ?? ''}
                    placeholder="3.8"
                  />
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedRecord?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <Field label="Bonus de 2 piezas">
                <Textarea
                  name="twoPieceBonus"
                  defaultValue={selectedRecord?.twoPieceBonus ?? ''}
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
                  defaultValue={selectedRecord?.fourPieceBonus ?? ''}
                  placeholder="Describe el bonus de cuatro piezas..."
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingRelicSet}>
                  {isSavingRelicSet ? 'Guardando...' : 'Guardar relic set'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleArchive()}
                  disabled={!selectedRecord}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <MediaSlotCard
              key={`relic-set-${type}-${selectedRecord?.id ?? 'empty'}-${selectedRecord?.splashArtAssetId ?? 'none'}`}
              title={copy.splashTitle}
              emptyMessage={copy.splashEmptyMessage}
              item={selectedRecord}
              imageUrl={selectedRecord?.splashArtUrl}
              assetId={selectedRecord?.splashArtAssetId}
              uploadButtonLabel="Subir splash art"
              onUpload={handleSplashUpload}
              onRemove={handleSplashRemove}
              isUploading={isUploadingSplashArt}
            />
          </div>
        </div>
      </div>
    </WindowPanel>
  );
}
