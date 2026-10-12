'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { WindowPanel } from '../../../../../components/ui/window-panel';
import { apiRequest, CursorPage, LightCone } from '../../../../../lib/api';
import { AdminAccessGate } from '../../../_components/admin-access-gate';
import {
  catalogStatusVariant,
  getRarityLabel,
  getStatusBadgeText,
} from '../../../_components/admin-catalog-helpers';
import { CatalogThumb } from '../../../_components/admin-catalog-thumb';
import { EntityList } from '../../../_components/admin-entity-list';
import { Field, SELECT_CLASSNAME } from '../../../_components/admin-form-fields';
import {
  readNumber,
  readOptionalText,
  readRequiredText,
  readText,
} from '../../../_components/admin-form-utils';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../../_components/admin-layout';
import { MediaSlotCard } from '../../../_components/admin-media-slot-card';
import { matchesQuery, upsertById } from '../../../_components/admin-utils';

const PAGE_SIZE = 25;

export function LightConesPanel() {
  return (
    <AdminAccessGate
      title="Gestión de conos de luz"
      subtitle="Necesitas iniciar sesión como administrador para gestionar el catálogo."
    >
      {({ accessToken }) => <LightConesWorkspace accessToken={accessToken} />}
    </AdminAccessGate>
  );
}

function LightConesWorkspace({ accessToken }: { accessToken: string }) {
  const [lightCones, setLightCones] = useState<LightCone[]>([]);
  const [lightConesNextCursor, setLightConesNextCursor] = useState<number | null>(
    null,
  );

  const [isLoadingLightCones, setIsLoadingLightCones] = useState(true);
  const [isLoadingMoreLightCones, setIsLoadingMoreLightCones] = useState(false);
  const [isSavingLightCone, setIsSavingLightCone] = useState(false);
  const [isUploadingSplashArt, setIsUploadingSplashArt] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [lightConeSearch, setLightConeSearch] = useState('');
  const [selectedLightConeId, setSelectedLightConeId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoadingLightCones(true);
      setLoadError('');

      try {
        const page = await apiRequest<CursorPage<LightCone>>(
          `/admin/light-cones?limit=${PAGE_SIZE}`,
          { token: accessToken },
        );

        if (!active) return;

        setLightCones(page.items);
        setLightConesNextCursor(page.nextCursor);
      } catch (error) {
        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los conos de luz.',
        );
      } finally {
        if (active) {
          setIsLoadingLightCones(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken]);

  async function loadMoreLightCones() {
    if (lightConesNextCursor === null) return;

    setIsLoadingMoreLightCones(true);
    try {
      const page = await apiRequest<CursorPage<LightCone>>(
        `/admin/light-cones?limit=${PAGE_SIZE}&cursor=${lightConesNextCursor}`,
        { token: accessToken },
      );

      setLightCones((current) => [...current, ...page.items]);
      setLightConesNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más conos de luz.',
      );
    } finally {
      setIsLoadingMoreLightCones(false);
    }
  }

  const filteredLightCones = useMemo(
    () =>
      lightCones.filter((lightCone) =>
        matchesQuery(
          [
            lightCone.name,
            lightCone.slug,
            lightCone.path,
            lightCone.status,
            lightCone.rarity.toString(),
          ],
          lightConeSearch,
        ),
      ),
    [lightConeSearch, lightCones],
  );

  const selectedLightCone =
    lightCones.find((lightCone) => lightCone.id === selectedLightConeId) ?? null;
  const selectedLightConeMode = selectedLightCone ? 'Edición' : 'Nuevo cono';

  async function handleLightConeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingLightCone(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        path: readRequiredText(formData, 'path', 'Camino'),
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const effectDescription = readOptionalText(formData, 'effectDescription');
      if (slug) {
        payload.slug = slug;
      }
      if (effectDescription) {
        payload.effectDescription = effectDescription;
      }

      const response = selectedLightCone
        ? await apiRequest<LightCone>(`/admin/light-cones/${selectedLightCone.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<LightCone>('/admin/light-cones', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      toast.success(selectedLightCone ? 'Cono actualizado.' : 'Cono de luz creado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el cono de luz.',
      );
    } finally {
      setIsSavingLightCone(false);
    }
  }

  async function handleLightConeArchive() {
    if (!selectedLightCone) return;

    const shouldArchive = window.confirm(`Archivar a ${selectedLightCone.name}?`);
    if (!shouldArchive) return;

    setIsSavingLightCone(true);

    try {
      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}`,
        { method: 'DELETE', token: accessToken },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      toast.success('Cono archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el cono de luz.',
      );
    } finally {
      setIsSavingLightCone(false);
    }
  }

  async function handleLightConeSplashUpload(formData: FormData) {
    if (!selectedLightCone) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}/splash-art`,
        { method: 'POST', token: accessToken, body: payload },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      toast.success('Splash art del cono actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleLightConeSplashRemove() {
    if (!selectedLightCone?.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}/splash-art`,
        { method: 'DELETE', token: accessToken },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
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
      title="Gestión de conos de luz"
      subtitle="Mantén el catálogo listo para el front y para futuras fichas visuales."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{filteredLightCones.length} visibles</Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSelectedLightConeId(null)}
          >
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
              items={filteredLightCones}
              selectedId={selectedLightConeId}
              onSelect={setSelectedLightConeId}
              search={lightConeSearch}
              onSearch={setLightConeSearch}
              searchPlaceholder="Buscar por nombre, slug, camino o rareza"
              emptyText={
                isLoadingLightCones
                  ? 'Cargando conos de luz...'
                  : 'No hay conos de luz que coincidan con tu búsqueda.'
              }
              hasMore={lightConesNextCursor !== null}
              onLoadMore={() => {
                void loadMoreLightCones();
              }}
              isLoadingMore={isLoadingMoreLightCones}
              renderItem={(lightCone) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={lightCone.splashArtUrl}
                    alt={lightCone.name}
                    placeholder={lightCone.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {lightCone.name}
                      </span>
                      <Badge variant={catalogStatusVariant(lightCone.status)}>
                        {getStatusBadgeText(lightCone.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {lightCone.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="brand">{lightCone.path}</Badge>
                      <Badge variant="success">
                        {getRarityLabel(lightCone.rarity)}
                      </Badge>
                      {lightCone.splashArtUrl ? (
                        <Badge variant="success">Splash</Badge>
                      ) : (
                        <Badge variant="warning">Sin splash</Badge>
                      )}
                    </div>
                    {lightCone.effectDescription ? (
                      <p className="line-clamp-2 pt-1 text-[11px] text-[var(--ink-500)]">
                        {lightCone.effectDescription}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedLightCone?.id ?? 'new-light-cone'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleLightConeSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedLightConeMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedLightCone ? selectedLightCone.name : 'Crear cono de luz'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    La media se sube en el panel lateral para mantener el flujo
                    de edición limpio.
                  </p>
                </div>
                {selectedLightCone ? (
                  <Badge variant={catalogStatusVariant(selectedLightCone.status)}>
                    {getStatusBadgeText(selectedLightCone.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedLightCone?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. El backend genera uno si lo dejas vacío."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedLightCone?.slug ?? ''}
                    placeholder="cono-de-luz"
                  />
                </Field>
                <Field label="Camino">
                  <Input
                    name="path"
                    defaultValue={selectedLightCone?.path ?? ''}
                    placeholder="Harmony, Hunt..."
                    required
                  />
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedLightCone?.rarity ?? 5}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedLightCone?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <Field
                label="Descripción del efecto"
                hint="Opcional, pero recomendado para completar la ficha del objeto."
              >
                <Textarea
                  name="effectDescription"
                  defaultValue={selectedLightCone?.effectDescription ?? ''}
                  placeholder="Describe el efecto principal del cono..."
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingLightCone}>
                  {isSavingLightCone ? 'Guardando...' : 'Guardar cono'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedLightConeId(null)}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleLightConeArchive()}
                  disabled={!selectedLightCone}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <MediaSlotCard
              key={`light-cone-${selectedLightCone?.id ?? 'empty'}-${selectedLightCone?.splashArtAssetId ?? 'none'}`}
              title="Splash art de cono"
              emptyMessage="Selecciona un cono de luz para gestionar su imagen."
              item={selectedLightCone}
              imageUrl={selectedLightCone?.splashArtUrl}
              assetId={selectedLightCone?.splashArtAssetId}
              uploadButtonLabel="Subir splash art"
              onUpload={handleLightConeSplashUpload}
              onRemove={handleLightConeSplashRemove}
              isUploading={isUploadingSplashArt}
            />
          </div>
        </div>
      </div>
    </WindowPanel>
  );
}
