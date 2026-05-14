'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  UserCharacterForm,
  type UserCharacterFormValues,
} from '../components/characters/user-character-form';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { clearAuthTokens, loadAuthTokens, saveAuthTokens } from '../lib/auth-storage';
import {
  apiRequest,
  AuthResponse,
  Character,
  CursorPage,
  LightCone,
  UserCharacter,
} from '../lib/api';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
});

type Me = {
  id: number;
  name: string;
  email: string;
};

type UserCharacterMutationPayload = {
  characterId: number;
  level: number;
  eidolon: number;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  lightConeId: number | null;
  lightConeLevel: number | null;
};

function buildCreateCharacterFormValues(
  character: Character | null,
): UserCharacterFormValues {
  return {
    characterId: character ? String(character.id) : '',
    lightConeId: '',
    level: '80',
    eidolon: '0',
    atk: character ? String(character.baseAtk) : '0',
    critRate: character ? String(character.baseCritRate) : '0',
    critDamage: character ? String(character.baseCritDamage) : '0',
    speed: character ? String(character.baseSpeed) : '100',
    lightConeLevel: '',
  };
}

function buildEditCharacterFormValues(
  entry: UserCharacter,
  lightCones: LightCone[],
): UserCharacterFormValues {
  const resolvedLightConeId =
    entry.lightCone?.id ??
    lightCones.find((lightCone) => lightCone.name === entry.lightConeName)?.id;

  return {
    characterId: String(entry.character.id),
    lightConeId: resolvedLightConeId ? String(resolvedLightConeId) : '',
    level: String(entry.level),
    eidolon: String(entry.eidolon),
    atk: String(entry.atk),
    critRate: String(entry.critRate),
    critDamage: String(entry.critDamage),
    speed: String(entry.speed),
    lightConeLevel:
      resolvedLightConeId && entry.lightConeLevel
        ? String(entry.lightConeLevel)
        : '',
  };
}

function buildUserCharacterPayload(
  values: UserCharacterFormValues,
): UserCharacterMutationPayload {
  const characterId = Number(values.characterId);
  const level = Number(values.level);
  const eidolon = Number(values.eidolon);
  const atk = Number(values.atk);
  const critRate = Number(values.critRate);
  const critDamage = Number(values.critDamage);
  const speed = Number(values.speed);
  const lightConeIdText = values.lightConeId.trim();

  const parsedValues = [
    characterId,
    level,
    eidolon,
    atk,
    critRate,
    critDamage,
    speed,
  ];

  if (parsedValues.some((value) => !Number.isFinite(value))) {
    throw new Error('Completa el formulario con valores numericos validos.');
  }

  if (
    characterId < 1 ||
    level < 1 ||
    eidolon < 0 ||
    atk < 0 ||
    critRate < 0 ||
    critDamage < 0 ||
    speed < 0
  ) {
    throw new Error('Los stats deben respetar los minimos permitidos.');
  }

  const payload: UserCharacterMutationPayload = {
    characterId: Math.trunc(characterId),
    level: Math.trunc(level),
    eidolon: Math.trunc(eidolon),
    atk: Math.trunc(atk),
    critRate,
    critDamage,
    speed: Math.trunc(speed),
    lightConeId: null,
    lightConeLevel: null,
  };

  if (lightConeIdText) {
    const lightConeId = Number(lightConeIdText);
    if (!Number.isFinite(lightConeId) || lightConeId < 1) {
      throw new Error('Selecciona un cono de luz valido.');
    }
    payload.lightConeId = Math.trunc(lightConeId);
  }

  const lightConeLevelText = values.lightConeLevel.trim();
  if (lightConeLevelText) {
    const lightConeLevel = Number(lightConeLevelText);
    if (!Number.isFinite(lightConeLevel) || lightConeLevel < 1) {
      throw new Error('El nivel del cono debe ser un numero mayor o igual a 1.');
    }
    if (payload.lightConeId == null) {
      throw new Error('Selecciona un cono de luz antes de guardar su nivel.');
    }
    payload.lightConeLevel = Math.trunc(lightConeLevel);
  }

  return payload;
}

export default function Home() {
  const [accessToken, setAccessToken] = useState<string>(
    () => loadAuthTokens().accessToken,
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    () => loadAuthTokens().refreshToken,
  );
  const [me, setMe] = useState<Me | null>(null);
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [lightCones, setLightCones] = useState<LightCone[]>([]);
  const [myCharacters, setMyCharacters] = useState<UserCharacter[]>([]);
  const [createForm, setCreateForm] = useState<UserCharacterFormValues>(
    buildCreateCharacterFormValues(null),
  );
  const [useManualStats, setUseManualStats] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<UserCharacterFormValues | null>(
    null,
  );
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isUpdatingCharacter, setIsUpdatingCharacter] = useState(false);
  const [deletingCharacterId, setDeletingCharacterId] = useState<number | null>(
    null,
  );
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  function handleLocalLogout() {
    setAccessToken('');
    setRefreshToken('');
    setMe(null);
    setMyCharacters([]);
    setCreateForm(buildCreateCharacterFormValues(null));
    setUseManualStats(false);
    setEditingCharacterId(null);
    setEditingForm(null);
    clearAuthTokens();
  }

  useEffect(() => {
    Promise.all([
      apiRequest<CursorPage<Character>>('/characters?limit=100'),
      apiRequest<CursorPage<LightCone>>('/light-cones?limit=100'),
    ])
      .then(([characterPage, lightConePage]) => {
        setCatalog(characterPage.items);
        setLightCones(lightConePage.items);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([
      apiRequest<Me>('/auth/me', { token: accessToken }),
      loadOwnedCharacters(accessToken),
    ])
      .then(([profile, owned]) => {
        setMe(profile);
        setMyCharacters(owned.items);
      })
      .catch((err: Error) => {
        setError(err.message);
        handleLocalLogout();
      });
  }, [accessToken]);

  const selectedCharacter = useMemo(
    () =>
      catalog.find((character) => character.id === Number(createForm.characterId)) ??
      null,
    [catalog, createForm.characterId],
  );

  const editingEntry = useMemo(
    () =>
      myCharacters.find((entry) => entry.id === editingCharacterId) ?? null,
    [editingCharacterId, myCharacters],
  );

  async function loadOwnedCharacters(token: string) {
    return apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
      token,
    });
  }

  async function refreshOwnedCharacters(token = accessToken) {
    if (!token) return;
    const refreshed = await loadOwnedCharacters(token);
    setMyCharacters(refreshed.items);
  }

  function handleCreateFormFieldChange(
    field: keyof UserCharacterFormValues,
    value: string,
  ) {
    if (field === 'characterId') {
      const nextCharacter =
        catalog.find((character) => String(character.id) === value) ?? null;
      setCreateForm(buildCreateCharacterFormValues(nextCharacter));
      return;
    }

    if (field === 'lightConeId' && !value) {
      setCreateForm((current) => ({
        ...current,
        lightConeId: '',
        lightConeLevel: '',
      }));
      return;
    }

    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEditingFormFieldChange(
    field: keyof UserCharacterFormValues,
    value: string,
  ) {
    setEditingForm((current) =>
      current
        ? {
            ...current,
            ...(field === 'lightConeId' && !value
              ? { lightConeId: '', lightConeLevel: '' }
              : {}),
            [field]: value,
          }
        : current,
    );
  }

  function handleManualStatsToggle(checked: boolean) {
    setUseManualStats(checked);

    if (!checked) {
      setCreateForm((current) => ({
        ...buildCreateCharacterFormValues(selectedCharacter),
        lightConeId: current.lightConeId,
        lightConeLevel: current.lightConeLevel,
      }));
    }
  }

  async function handleAuthSubmit(
    event: FormEvent<HTMLFormElement>,
    mode: 'register' | 'login',
  ) {
    event.preventDefault();
    setError('');
    setStatus('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    };

    try {
      const parsed =
        mode === 'register'
          ? registerSchema.parse(payload)
          : loginSchema.parse(payload);

      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const response = await apiRequest<AuthResponse>(path, {
        method: 'POST',
        body: parsed,
      });

      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      saveAuthTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setStatus(
        mode === 'register' ? 'Cuenta creada con exito.' : 'Sesion iniciada.',
      );
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible autenticar');
    }
  }

  async function handleCreateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selectedCharacter) return;

    setError('');
    setStatus('');
    setIsCreatingCharacter(true);

    try {
      const payload = buildUserCharacterPayload(createForm);

      await apiRequest<UserCharacter>('/user-characters', {
        method: 'POST',
        token: accessToken,
        body: payload,
      });

      await refreshOwnedCharacters();
      setCreateForm(buildCreateCharacterFormValues(selectedCharacter));
      setUseManualStats(false);
      setStatus(`${selectedCharacter.name} agregado a tu cuenta.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible agregar personaje',
      );
    } finally {
      setIsCreatingCharacter(false);
    }
  }

  async function handleUpdateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !editingCharacterId || !editingForm || !editingEntry) return;

    setError('');
    setStatus('');
    setIsUpdatingCharacter(true);

    try {
      const payload = buildUserCharacterPayload(editingForm);
      await apiRequest<UserCharacter>(`/user-characters/${editingCharacterId}`, {
        method: 'PATCH',
        token: accessToken,
        body: payload,
      });

      await refreshOwnedCharacters();
      setEditingCharacterId(null);
      setEditingForm(null);
      setStatus(`${editingEntry.character.name} fue actualizado correctamente.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible actualizar personaje',
      );
    } finally {
      setIsUpdatingCharacter(false);
    }
  }

  function startEditingCharacter(entry: UserCharacter) {
    setEditingCharacterId(entry.id);
    setEditingForm(buildEditCharacterFormValues(entry, lightCones));
  }

  function cancelEditingCharacter() {
    setEditingCharacterId(null);
    setEditingForm(null);
  }

  async function handleDeleteCharacter(entry: UserCharacter) {
    if (!accessToken) return;

    const shouldDelete = window.confirm(
      `Eliminar a ${entry.character.name} de tu cuenta?`,
    );

    if (!shouldDelete) {
      return;
    }

    setError('');
    setStatus('');
    setDeletingCharacterId(entry.id);

    try {
      await apiRequest<{ success: boolean }>(`/user-characters/${entry.id}`, {
        method: 'DELETE',
        token: accessToken,
      });

      await refreshOwnedCharacters();

      if (editingCharacterId === entry.id) {
        cancelEditingCharacter();
      }

      setStatus(`${entry.character.name} fue eliminado de tu cuenta.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible eliminar personaje',
      );
    } finally {
      setDeletingCharacterId(null);
    }
  }

  async function handleChangePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get('email') ?? ''),
      newPassword: String(formData.get('newPassword') ?? ''),
    };

    try {
      const parsed = changePasswordSchema.parse(payload);
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/change-password',
        {
          method: 'POST',
          body: parsed,
        },
      );

      setStatus(
        'Contrasena actualizada. Inicia sesion con tu nueva contrasena.',
      );
      setShowChangePassword(false);
      event.currentTarget.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cambiar la contrasena',
      );
    }
  }

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } finally {
      handleLocalLogout();
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(234,88,12,0.2),transparent_40%)]" />

      <Card
        className="border-[var(--line-strong)]"
        title="OmniGacha"
        subtitle="Decisiones inteligentes para tus pulls en Honkai: Star Rail"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-600)]">
            MVP activo: autenticacion segura, catalogo base y gestion de personajes.
          </p>
          <Link className="text-sm font-semibold text-[var(--brand-700)] hover:underline" href="/simulator">
            Ir al simulador de recomendacion
          </Link>
        </div>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {status ? <Alert tone="success">{status}</Alert> : null}

      {!accessToken ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <Card title="Crear cuenta" subtitle="Empieza tu perfil OmniGacha.">
            <form
              className="space-y-3"
              onSubmit={(event) => handleAuthSubmit(event, 'register')}
            >
              <Input name="name" placeholder="Nombre" required />
              <Input name="email" type="email" placeholder="Correo" required />
              <Input
                name="password"
                type="password"
                placeholder="Contrasena (8+)"
                required
              />
              <Button type="submit">Registrarme</Button>
            </form>
          </Card>

          <Card title="Iniciar sesion" subtitle="Continua donde lo dejaste.">
            <form
              className="space-y-3"
              onSubmit={(event) => handleAuthSubmit(event, 'login')}
            >
              <Input name="email" type="email" placeholder="Correo" required />
              <Input
                name="password"
                type="password"
                placeholder="Contrasena"
                required
              />
              <Button type="submit">Entrar</Button>
            </form>

            <div className="mt-4 border-t border-[var(--line)] pt-3">
              <button
                className="text-sm font-semibold text-[var(--brand-700)] hover:underline"
                type="button"
                onClick={() => setShowChangePassword((prev) => !prev)}
              >
                {showChangePassword
                  ? 'Ocultar cambio de contrasena'
                  : 'Cambiar contrasena'}
              </button>

              {showChangePassword ? (
                <form
                  className="mt-3 space-y-3"
                  onSubmit={handleChangePasswordSubmit}
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Correo de tu cuenta"
                    required
                  />
                  <Input
                    name="newPassword"
                    type="password"
                    placeholder="Nueva contrasena (8+)"
                    required
                  />
                  <Button type="submit" variant="ghost">
                    Actualizar contrasena
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>
        </section>
      ) : (
        <>
          <Card className="border-[var(--line-strong)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink-900)]">
                  Bienvenido{me ? `, ${me.name}` : ''}
                </h2>
                <p className="text-sm text-[var(--ink-500)]">{me?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-sm font-semibold text-[var(--brand-700)] hover:underline" href="/simulator">
                  Simulador
                </Link>
                <Button variant="ghost" type="button" onClick={handleLogout}>
                  Cerrar sesion
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title="Agregar personaje"
            subtitle="Toma uno del catalogo base y agregalo a tu cuenta."
          >
            <UserCharacterForm
              catalog={catalog}
              lightCones={lightCones}
              values={createForm}
              onSubmit={handleCreateCharacter}
              onFieldChange={handleCreateFormFieldChange}
              submitLabel="Agregar a mi cuenta"
              isSubmitting={isCreatingCharacter}
              showManualToggle
              useManualStats={useManualStats}
              onUseManualStatsChange={handleManualStatsToggle}
              characterPath={selectedCharacter?.path ?? null}
            />
          </Card>

          {editingEntry && editingForm ? (
            <Card
              title={`Editar personaje: ${editingEntry.character.name}`}
              subtitle="Actualiza los stats guardados en tu cuenta."
            >
              <UserCharacterForm
                catalog={catalog}
                lightCones={lightCones}
                values={editingForm}
                onSubmit={handleUpdateCharacter}
                onFieldChange={handleEditingFormFieldChange}
                submitLabel="Guardar cambios"
                isSubmitting={isUpdatingCharacter}
                showStatsByDefault
                disableCharacterSelect
                characterPath={editingEntry.character.path}
                onCancel={cancelEditingCharacter}
              />
            </Card>
          ) : null}

          <Card
            title="Mis personajes"
            subtitle="Inventario inicial registrado en tu cuenta."
          >
            {myCharacters.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">
                Aun no tienes personajes registrados.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {myCharacters.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-xl border p-3 ${
                      editingCharacterId === entry.id
                        ? 'border-[var(--brand-400)] bg-[var(--surface)] shadow-[0_0_0_1px_var(--brand-200)]'
                        : 'border-[var(--line)] bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--ink-900)]">
                          {entry.character.name}
                        </p>
                        <p className="text-sm text-[var(--ink-500)]">
                          {entry.character.element} / {entry.character.path} /{' '}
                          {entry.character.role}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => startEditingCharacter(entry)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-rose-700 ring-rose-200 hover:bg-rose-50 focus-visible:ring-rose-300"
                          disabled={deletingCharacterId === entry.id}
                          onClick={() => handleDeleteCharacter(entry)}
                        >
                          {deletingCharacterId === entry.id
                            ? 'Eliminando...'
                            : 'Eliminar'}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium tracking-wide text-[var(--ink-700)]">
                      LVL {entry.level} · E{entry.eidolon} · ATK {entry.atk} · CR{' '}
                      {Math.round(entry.critRate * 100)}% · CD{' '}
                      {Math.round(entry.critDamage * 100)}% · SPD {entry.speed}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-500)]">
                      {entry.lightCone?.name || entry.lightConeName
                        ? `Cono: ${entry.lightCone?.name ?? entry.lightConeName}${entry.lightConeLevel ? ` · Nivel ${entry.lightConeLevel}` : ''}`
                        : 'Sin cono de luz registrado'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
