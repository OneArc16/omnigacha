'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { UserCharacterFormValues } from '../../../components/characters/user-character-form';
import {
  apiRequest,
  Character,
  CharacterStatKey,
  CursorPage,
  LightCone,
  UserCharacter,
} from '../../../lib/api';
import { resolveErrorMessage } from '../../../lib/errors';
import {
  buildCreateCharacterFormValues,
  buildEditCharacterFormValues,
  buildUserCharacterPayload,
} from './user-character-payload';

type FormField = Exclude<keyof UserCharacterFormValues, 'stats'>;

function fetchOwnedCharacters(token: string) {
  return apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
    token,
  });
}

// Limpiar el cono equipado también invalida su nivel.
function applyFieldChange(
  form: UserCharacterFormValues,
  field: FormField,
  value: string,
): UserCharacterFormValues {
  if (field === 'lightConeId' && !value) {
    return { ...form, lightConeId: '', lightConeLevel: '' };
  }

  return { ...form, [field]: value };
}

/**
 * Estado y mutaciones del roster del usuario. Se monta por sesión: al cambiar
 * de token el consumidor lo vuelve a montar y el estado parte de cero.
 */
export function useRoster(
  accessToken: string,
  onRosterChanged: () => Promise<void>,
) {
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [lightCones, setLightCones] = useState<LightCone[]>([]);
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState<UserCharacterFormValues>(() =>
    buildCreateCharacterFormValues(null),
  );
  const [useManualStats, setUseManualStats] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<UserCharacterFormValues | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest<CursorPage<Character>>('/characters?limit=100'),
      apiRequest<CursorPage<LightCone>>('/light-cones?limit=100'),
      fetchOwnedCharacters(accessToken),
    ])
      .then(([characterPage, lightConePage, ownedPage]) => {
        if (!active) return;
        setCatalog(characterPage.items);
        setLightCones(lightConePage.items);
        setCharacters(ownedPage.items);
        setError('');
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const selectedCharacter = useMemo(
    () =>
      catalog.find((character) => character.id === Number(createForm.characterId)) ??
      null,
    [catalog, createForm.characterId],
  );

  const editingEntry = useMemo(
    () => characters.find((entry) => entry.id === editingId) ?? null,
    [characters, editingId],
  );

  async function reloadAfterMutation() {
    const [ownedPage] = await Promise.all([
      fetchOwnedCharacters(accessToken),
      onRosterChanged(),
    ]);
    setCharacters(ownedPage.items);
  }

  function changeCreateField(field: FormField, value: string) {
    if (field === 'characterId') {
      const nextCharacter =
        catalog.find((character) => String(character.id) === value) ?? null;
      setCreateForm(buildCreateCharacterFormValues(nextCharacter));
      return;
    }

    setCreateForm((current) => applyFieldChange(current, field, value));
  }

  function changeCreateStat(field: CharacterStatKey, value: string) {
    setCreateForm((current) => ({
      ...current,
      stats: { ...current.stats, [field]: value },
    }));
  }

  function changeEditingField(field: FormField, value: string) {
    setEditingForm((current) =>
      current ? applyFieldChange(current, field, value) : current,
    );
  }

  function changeEditingStat(field: CharacterStatKey, value: string) {
    setEditingForm((current) =>
      current
        ? { ...current, stats: { ...current.stats, [field]: value } }
        : current,
    );
  }

  function toggleManualStats(checked: boolean) {
    setUseManualStats(checked);

    if (!checked) {
      setCreateForm((current) => ({
        ...buildCreateCharacterFormValues(selectedCharacter),
        lightConeId: current.lightConeId,
        lightConeLevel: current.lightConeLevel,
      }));
    }
  }

  function startEditing(entry: UserCharacter) {
    setEditingId(entry.id);
    setEditingForm(buildEditCharacterFormValues(entry, lightCones));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingForm(null);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCharacter) return;

    setIsCreating(true);

    try {
      await apiRequest<UserCharacter>('/user-characters', {
        method: 'POST',
        token: accessToken,
        body: buildUserCharacterPayload(
          createForm,
          selectedCharacter,
          useManualStats,
        ),
      });

      await reloadAfterMutation();
      setCreateForm(buildCreateCharacterFormValues(selectedCharacter));
      setUseManualStats(false);
      toast.success(`${selectedCharacter.name} agregado a tu cuenta.`);
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible agregar personaje'));
    } finally {
      setIsCreating(false);
    }
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingForm || !editingEntry) return;

    setIsUpdating(true);

    try {
      await apiRequest<UserCharacter>(`/user-characters/${editingEntry.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: buildUserCharacterPayload(editingForm, editingEntry.character, true),
      });

      await reloadAfterMutation();
      cancelEditing();
      toast.success(
        `${editingEntry.character.name} fue actualizado correctamente.`,
      );
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible actualizar personaje'),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function remove(entry: UserCharacter) {
    const shouldDelete = window.confirm(
      `¿Eliminar a ${entry.character.name} de tu cuenta?`,
    );
    if (!shouldDelete) return;

    setDeletingId(entry.id);

    try {
      await apiRequest<{ success: boolean }>(`/user-characters/${entry.id}`, {
        method: 'DELETE',
        token: accessToken,
      });

      await reloadAfterMutation();
      if (editingId === entry.id) cancelEditing();
      toast.success(`${entry.character.name} fue eliminado de tu cuenta.`);
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible eliminar personaje'));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    catalog,
    lightCones,
    characters,
    isLoading,
    error,
    create: {
      values: createForm,
      selectedCharacter,
      useManualStats,
      isSubmitting: isCreating,
      changeField: changeCreateField,
      changeStat: changeCreateStat,
      toggleManualStats,
      submit: submitCreate,
    },
    editing:
      editingEntry && editingForm
        ? {
            entry: editingEntry,
            values: editingForm,
            isSubmitting: isUpdating,
            changeField: changeEditingField,
            changeStat: changeEditingStat,
            submit: submitUpdate,
            cancel: cancelEditing,
          }
        : null,
    deletingId,
    startEditing,
    remove,
  };
}

export type Roster = ReturnType<typeof useRoster>;
