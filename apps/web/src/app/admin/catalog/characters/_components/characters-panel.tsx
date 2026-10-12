'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { WindowPanel } from '../../../../../components/ui/window-panel';
import { apiRequest, Character, CursorPage } from '../../../../../lib/api';
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

export function CharactersPanel() {
  return (
    <AdminAccessGate
      title="Gestión de personajes"
      subtitle="Necesitas iniciar sesión como administrador para gestionar el catálogo."
    >
      {({ accessToken }) => <CharactersWorkspace accessToken={accessToken} />}
    </AdminAccessGate>
  );
}

function CharactersWorkspace({ accessToken }: { accessToken: string }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersNextCursor, setCharactersNextCursor] = useState<number | null>(
    null,
  );

  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [isLoadingMoreCharacters, setIsLoadingMoreCharacters] = useState(false);
  const [isSavingCharacter, setIsSavingCharacter] = useState(false);
  const [isUploadingSplashArt, setIsUploadingSplashArt] = useState(false);
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [characterSearch, setCharacterSearch] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoadingCharacters(true);
      setLoadError('');

      try {
        const page = await apiRequest<CursorPage<Character>>(
          `/admin/characters?limit=${PAGE_SIZE}`,
          { token: accessToken },
        );

        if (!active) return;

        setCharacters(page.items);
        setCharactersNextCursor(page.nextCursor);
      } catch (error) {
        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los personajes.',
        );
      } finally {
        if (active) {
          setIsLoadingCharacters(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken]);

  async function loadMoreCharacters() {
    if (charactersNextCursor === null) return;

    setIsLoadingMoreCharacters(true);
    try {
      const page = await apiRequest<CursorPage<Character>>(
        `/admin/characters?limit=${PAGE_SIZE}&cursor=${charactersNextCursor}`,
        { token: accessToken },
      );

      setCharacters((current) => [...current, ...page.items]);
      setCharactersNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más personajes.',
      );
    } finally {
      setIsLoadingMoreCharacters(false);
    }
  }

  const filteredCharacters = useMemo(
    () =>
      characters.filter((character) =>
        matchesQuery(
          [
            character.name,
            character.slug,
            character.element,
            character.path,
            character.role,
            character.status,
          ],
          characterSearch,
        ),
      ),
    [characterSearch, characters],
  );

  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ?? null;
  const selectedCharacterMode = selectedCharacter ? 'Edición' : 'Nuevo personaje';

  async function handleCharacterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingCharacter(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        element: readRequiredText(formData, 'element', 'Elemento'),
        path: readRequiredText(formData, 'path', 'Camino'),
        role: readRequiredText(formData, 'role', 'Rol'),
        baseHp: readNumber(formData, 'baseHp', 'HP base', {
          required: false,
          integer: true,
          min: 0,
        }),
        baseAtk: readNumber(formData, 'baseAtk', 'ATK base', {
          integer: true,
          min: 0,
        }),
        baseDef: readNumber(formData, 'baseDef', 'DEF base', {
          required: false,
          integer: true,
          min: 0,
        }),
        baseCritRate: readNumber(formData, 'baseCritRate', 'Prob. CRIT', {
          min: 0,
        }),
        baseCritDamage: readNumber(formData, 'baseCritDamage', 'Daño CRIT', {
          min: 0,
        }),
        baseSpeed: readNumber(formData, 'baseSpeed', 'Velocidad base', {
          integer: true,
          min: 0,
        }),
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const gameVersion = readOptionalText(formData, 'gameVersion');

      if (slug) {
        payload.slug = slug;
      }

      if (gameVersion) {
        payload.gameVersion = gameVersion;
      }

      const response = selectedCharacter
        ? await apiRequest<Character>(`/admin/characters/${selectedCharacter.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<Character>('/admin/characters', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      toast.success(
        selectedCharacter ? 'Personaje actualizado.' : 'Personaje creado.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el personaje.',
      );
    } finally {
      setIsSavingCharacter(false);
    }
  }

  async function handleCharacterArchive() {
    if (!selectedCharacter) return;

    const shouldArchive = window.confirm(`Archivar a ${selectedCharacter.name}?`);
    if (!shouldArchive) return;

    setIsSavingCharacter(true);

    try {
      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}`,
        { method: 'DELETE', token: accessToken },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      toast.success('Personaje archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el personaje.',
      );
    } finally {
      setIsSavingCharacter(false);
    }
  }

  async function handleCharacterSplashUpload(formData: FormData) {
    if (!selectedCharacter) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/splash-art`,
        { method: 'POST', token: accessToken, body: payload },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      toast.success('Splash art de personaje actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleCharacterSplashRemove() {
    if (!selectedCharacter?.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/splash-art`,
        { method: 'DELETE', token: accessToken },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
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

  async function handleCharacterPortraitUpload(formData: FormData) {
    if (!selectedCharacter) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingPortrait(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/portrait`,
        { method: 'POST', token: accessToken, body: payload },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      toast.success('Retrato de personaje actualizado.');
    } finally {
      setIsUploadingPortrait(false);
    }
  }

  async function handleCharacterPortraitRemove() {
    if (!selectedCharacter?.portraitAssetId) return;

    setIsUploadingPortrait(true);

    try {
      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/portrait`,
        { method: 'DELETE', token: accessToken },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      toast.success('Retrato eliminado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la imagen.',
      );
    } finally {
      setIsUploadingPortrait(false);
    }
  }

  return (
    <WindowPanel
      title="Gestión de personajes"
      subtitle="Mantén el catálogo editorial y prepara el splash art para el front."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{filteredCharacters.length} visibles</Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSelectedCharacterId(null)}
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
              items={filteredCharacters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              search={characterSearch}
              onSearch={setCharacterSearch}
              searchPlaceholder="Buscar por nombre, slug, rol o elemento"
              emptyText={
                isLoadingCharacters
                  ? 'Cargando personajes...'
                  : 'No hay personajes que coincidan con tu búsqueda.'
              }
              hasMore={charactersNextCursor !== null}
              onLoadMore={() => {
                void loadMoreCharacters();
              }}
              isLoadingMore={isLoadingMoreCharacters}
              renderItem={(character) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={character.splashArtUrl}
                    alt={character.name}
                    placeholder={character.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {character.name}
                      </span>
                      <Badge variant={catalogStatusVariant(character.status)}>
                        {getStatusBadgeText(character.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {character.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="brand">{character.element}</Badge>
                      <Badge variant="outline">{character.path}</Badge>
                      <Badge variant="neutral">{character.role}</Badge>
                      <Badge variant="success">
                        {getRarityLabel(character.rarity)}
                      </Badge>
                    </div>
                    <p className="pt-1 text-[11px] text-[var(--ink-500)]">
                      ATK {character.baseAtk} · DEF {character.baseDef} · SPD{' '}
                      {character.baseSpeed}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedCharacter?.id ?? 'new-character'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleCharacterSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedCharacterMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedCharacter ? selectedCharacter.name : 'Crear personaje'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    Los splash art se suben desde el panel lateral para no
                    mezclar media con los datos del personaje.
                  </p>
                </div>
                {selectedCharacter ? (
                  <Badge variant={catalogStatusVariant(selectedCharacter.status)}>
                    {getStatusBadgeText(selectedCharacter.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedCharacter?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. Si lo dejas vacío, el backend lo genera."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedCharacter?.slug ?? ''}
                    placeholder="personaje-slug"
                  />
                </Field>
                <Field label="Elemento">
                  <Input
                    name="element"
                    defaultValue={selectedCharacter?.element ?? ''}
                    placeholder="Fire, Ice, Quantum..."
                    required
                  />
                </Field>
                <Field label="Camino">
                  <Input
                    name="path"
                    defaultValue={selectedCharacter?.path ?? ''}
                    placeholder="Destruction, Harmony..."
                    required
                  />
                </Field>
                <Field label="Rol">
                  <Input
                    name="role"
                    defaultValue={selectedCharacter?.role ?? ''}
                    placeholder="DPS, support..."
                    required
                  />
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedCharacter?.rarity ?? 5}
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
                    defaultValue={selectedCharacter?.gameVersion ?? ''}
                    placeholder="3.8"
                  />
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedCharacter?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="HP base">
                  <Input
                    name="baseHp"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseHp ?? 0}
                  />
                </Field>
                <Field label="ATK base">
                  <Input
                    name="baseAtk"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseAtk ?? 0}
                    required
                  />
                </Field>
                <Field label="DEF base">
                  <Input
                    name="baseDef"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseDef ?? 0}
                  />
                </Field>
                <Field label="Prob. CRIT">
                  <Input
                    name="baseCritRate"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={selectedCharacter?.baseCritRate ?? 0}
                    required
                  />
                </Field>
                <Field label="Daño CRIT">
                  <Input
                    name="baseCritDamage"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={selectedCharacter?.baseCritDamage ?? 0}
                    required
                  />
                </Field>
                <Field label="Velocidad base">
                  <Input
                    name="baseSpeed"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseSpeed ?? 0}
                    required
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingCharacter}>
                  {isSavingCharacter ? 'Guardando...' : 'Guardar personaje'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedCharacterId(null)}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleCharacterArchive()}
                  disabled={!selectedCharacter}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <div className="grid gap-4 lg:grid-cols-2">
              <MediaSlotCard
                key={`character-splash-${selectedCharacter?.id ?? 'empty'}-${selectedCharacter?.splashArtAssetId ?? 'none'}`}
                title="Splash art de personaje"
                emptyMessage="Selecciona un personaje para subir o quitar su splash art."
                item={selectedCharacter}
                imageUrl={selectedCharacter?.splashArtUrl}
                assetId={selectedCharacter?.splashArtAssetId}
                uploadButtonLabel="Subir splash art"
                onUpload={handleCharacterSplashUpload}
                onRemove={handleCharacterSplashRemove}
                isUploading={isUploadingSplashArt}
              />
              <MediaSlotCard
                key={`character-portrait-${selectedCharacter?.id ?? 'empty'}-${selectedCharacter?.portraitAssetId ?? 'none'}`}
                title="Retrato de catálogo"
                emptyMessage="Selecciona un personaje para subir o quitar su retrato."
                item={selectedCharacter}
                imageUrl={selectedCharacter?.portraitUrl}
                assetId={selectedCharacter?.portraitAssetId}
                uploadButtonLabel="Subir retrato"
                previewAspectClassName="aspect-[3/4] max-w-[220px]"
                hint="Se usa en roster, recomendación, simulación y catálogo visual."
                onUpload={handleCharacterPortraitUpload}
                onRemove={handleCharacterPortraitRemove}
                isUploading={isUploadingPortrait}
              />
            </div>
          </div>
        </div>
      </div>
    </WindowPanel>
  );
}
