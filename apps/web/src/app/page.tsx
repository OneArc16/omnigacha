'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  UserCharacterForm,
  type UserCharacterFormValues,
} from '../components/characters/user-character-form';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ButtonLink } from '../components/ui/button-link';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { SegmentedTabs } from '../components/ui/segmented-tabs';
import { Skeleton } from '../components/ui/skeleton';
import { WindowPanel } from '../components/ui/window-panel';
import {
  getAppBackdropClassName,
  getAppShellClassName,
  WORKSPACE_ACCOUNT_GRID_CLASSNAME,
  WORKSPACE_HERO_GRID_CLASSNAME,
  WORKSPACE_OVERVIEW_GRID_CLASSNAME,
  WORKSPACE_ROSTER_GRID_CLASSNAME,
} from '../components/layout/page-shell';
import {
  clearAuthTokens,
  saveAuthTokens,
  useAuthTokens,
  useHydratedValue,
} from '../lib/auth-storage';
import {
  apiRequest,
  AuthResponse,
  Character,
  CharacterStatKey,
  CharacterStatsMap,
  CursorPage,
  DashboardSummaryResponse,
  LightCone,
  UserCharacter,
} from '../lib/api';
import {
  buildCharacterStatsFormValues,
  buildEmptyCharacterStatsFormValues,
  formatCharacterStatChip,
  fromStatInputValue,
  getVisibleCharacterStatKeys,
} from '../lib/character-stats';

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
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

type Me = {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
};

type UserCharacterMutationPayload = {
  characterId: number;
  level: number;
  eidolon: number;
  stats?: CharacterStatsMap;
  lightConeId: number | null;
  lightConeLevel: number | null;
};

type RecommendationLevel =
  NonNullable<DashboardSummaryResponse['lastRecommendation']>['recommendation'];

type AuthView = 'login' | 'register';
type WorkspaceView = 'overview' | 'roster' | 'account';

function recommendationLevelToBadgeVariant(
  level: RecommendationLevel,
): 'neutral' | 'danger' | 'warning' | 'brand' | 'success' {
  switch (level) {
    case 'NO_RECOMENDADO':
      return 'danger';
    case 'SITUACIONAL':
      return 'warning';
    case 'RECOMENDADO':
      return 'brand';
    case 'MUY_RECOMENDADO':
      return 'success';
    default:
      return 'neutral';
  }
}

function buildCreateCharacterFormValues(
  character: Character | null,
): UserCharacterFormValues {
  return {
    characterId: character ? String(character.id) : '',
    lightConeId: '',
    level: '80',
    eidolon: '0',
    stats: character
      ? buildCharacterStatsFormValues(character.defaultStats)
      : buildEmptyCharacterStatsFormValues(),
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
    stats: buildCharacterStatsFormValues(entry.stats),
    lightConeLevel:
      resolvedLightConeId && entry.lightConeLevel
        ? String(entry.lightConeLevel)
        : '',
  };
}

function buildUserCharacterPayload(
  values: UserCharacterFormValues,
  character: Character | null,
  includeManualStats: boolean,
): UserCharacterMutationPayload {
  const characterId = Number(values.characterId);
  const level = Number(values.level);
  const eidolon = Number(values.eidolon);
  const lightConeIdText = values.lightConeId.trim();

  const parsedValues = [characterId, level, eidolon];

  if (parsedValues.some((value) => !Number.isFinite(value))) {
    throw new Error('Completa el formulario con valores numéricos válidos.');
  }

  if (characterId < 1 || level < 1 || eidolon < 0) {
    throw new Error('Los campos base deben respetar los mínimos permitidos.');
  }

  const payload: UserCharacterMutationPayload = {
    characterId: Math.trunc(characterId),
    level: Math.trunc(level),
    eidolon: Math.trunc(eidolon),
    lightConeId: null,
    lightConeLevel: null,
  };

  if (includeManualStats) {
    if (!character) {
      throw new Error('Selecciona un personaje antes de guardar stats.');
    }

    const stats: CharacterStatsMap = {};
    for (const statKey of getVisibleCharacterStatKeys(character)) {
      const rawValue = values.stats[statKey];
      const parsedValue = fromStatInputValue(statKey, rawValue);

      if (parsedValue === null) {
        throw new Error(`Completa el campo ${statKey} con un valor válido.`);
      }

      stats[statKey] = parsedValue;
    }

    payload.stats = stats;
  }

  if (lightConeIdText) {
    const lightConeId = Number(lightConeIdText);
    if (!Number.isFinite(lightConeId) || lightConeId < 1) {
      throw new Error('Selecciona un cono de luz válido.');
    }
    payload.lightConeId = Math.trunc(lightConeId);
  }

  const lightConeLevelText = values.lightConeLevel.trim();
  if (lightConeLevelText) {
    const lightConeLevel = Number(lightConeLevelText);
    if (!Number.isFinite(lightConeLevel) || lightConeLevel < 1) {
      throw new Error('El nivel del cono debe ser un número mayor o igual a 1.');
    }
    if (payload.lightConeId == null) {
      throw new Error('Selecciona un cono de luz antes de guardar su nivel.');
    }
    payload.lightConeLevel = Math.trunc(lightConeLevel);
  }

  return payload;
}

function formatRosterSummary(entry: UserCharacter) {
  return getVisibleCharacterStatKeys(entry.character)
    .slice(0, 4)
    .map((statKey) => formatCharacterStatChip(statKey, entry.stats[statKey]))
    .join(' · ');
}

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Home() {
  const { accessToken, refreshToken } = useAuthTokens();
  const isAuthHydrated = useHydratedValue();
  const [me, setMe] = useState<Me | null>(null);
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [lightCones, setLightCones] = useState<LightCone[]>([]);
  const [myCharacters, setMyCharacters] = useState<UserCharacter[]>([]);
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummaryResponse | null>(null);
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
  const [pageError, setPageError] = useState<string>('');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('overview');

  function handleLocalLogout() {
    setMe(null);
    setMyCharacters([]);
    setDashboardSummary(null);
    setCreateForm(buildCreateCharacterFormValues(null));
    setUseManualStats(false);
    setEditingCharacterId(null);
    setEditingForm(null);
    setWorkspaceView('overview');
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
        setPageError('');
      })
      .catch((err: Error) => {
        setPageError(err.message);
        toast.error(err.message);
      });
  }, []);

  useEffect(() => {
    if (!isAuthHydrated) {
      return;
    }

    if (!accessToken) return;

    Promise.all([
      apiRequest<Me>('/auth/me', { token: accessToken }),
      loadOwnedCharacters(accessToken),
      loadDashboardSummary(accessToken),
    ])
      .then(([profile, owned, summary]) => {
        setMe(profile);
        setMyCharacters(owned.items);
        setDashboardSummary(summary);
        setPageError('');
      })
      .catch((err: Error) => {
        setPageError(err.message);
        toast.error(err.message);
        handleLocalLogout();
      });
  }, [accessToken, isAuthHydrated]);

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

  const resolvedWorkspaceView =
    me?.mustChangePassword ? ('account' as WorkspaceView) : workspaceView;

  async function loadOwnedCharacters(token: string) {
    return apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
      token,
    });
  }

  async function loadDashboardSummary(token: string) {
    return apiRequest<DashboardSummaryResponse>('/dashboard/summary', {
      token,
    });
  }

  async function refreshOwnedCharacters(token = accessToken) {
    if (!token) return;
    const refreshed = await loadOwnedCharacters(token);
    setMyCharacters(refreshed.items);
  }

  async function refreshDashboardSummary(token = accessToken) {
    if (!token) return;
    const summary = await loadDashboardSummary(token);
    setDashboardSummary(summary);
  }

  function handleCreateFormFieldChange(
    field: Exclude<keyof UserCharacterFormValues, 'stats'>,
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
    field: Exclude<keyof UserCharacterFormValues, 'stats'>,
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

  function handleCreateFormStatFieldChange(
    field: CharacterStatKey,
    value: string,
  ) {
    setCreateForm((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [field]: value,
      },
    }));
  }

  function handleEditingFormStatFieldChange(
    field: CharacterStatKey,
    value: string,
  ) {
    setEditingForm((current) =>
      current
        ? {
            ...current,
            stats: {
              ...current.stats,
              [field]: value,
            },
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
    setPageError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
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

      saveAuthTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      toast.success(
        mode === 'register' ? 'Cuenta creada con éxito.' : 'Sesión iniciada.',
      );
      if (response.user.mustChangePassword) {
        setWorkspaceView('account');
      }
      form.reset();
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible autenticar'));
    }
  }

  async function handleCreateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selectedCharacter) return;

    setPageError('');
    setIsCreatingCharacter(true);

    try {
      const payload = buildUserCharacterPayload(
        createForm,
        selectedCharacter,
        useManualStats,
      );

      await apiRequest<UserCharacter>('/user-characters', {
        method: 'POST',
        token: accessToken,
        body: payload,
      });

      await Promise.all([refreshOwnedCharacters(), refreshDashboardSummary()]);
      setCreateForm(buildCreateCharacterFormValues(selectedCharacter));
      setUseManualStats(false);
      setWorkspaceView('roster');
      toast.success(`${selectedCharacter.name} agregado a tu cuenta.`);
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible agregar personaje'));
    } finally {
      setIsCreatingCharacter(false);
    }
  }

  async function handleUpdateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !editingCharacterId || !editingForm || !editingEntry) return;

    setPageError('');
    setIsUpdatingCharacter(true);

    try {
      const payload = buildUserCharacterPayload(
        editingForm,
        editingEntry.character,
        true,
      );
      await apiRequest<UserCharacter>(`/user-characters/${editingCharacterId}`, {
        method: 'PATCH',
        token: accessToken,
        body: payload,
      });

      await Promise.all([refreshOwnedCharacters(), refreshDashboardSummary()]);
      setEditingCharacterId(null);
      setEditingForm(null);
      setWorkspaceView('roster');
      toast.success(
        `${editingEntry.character.name} fue actualizado correctamente.`,
      );
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible actualizar personaje'),
      );
    } finally {
      setIsUpdatingCharacter(false);
    }
  }

  function startEditingCharacter(entry: UserCharacter) {
    setEditingCharacterId(entry.id);
    setEditingForm(buildEditCharacterFormValues(entry, lightCones));
    setWorkspaceView('roster');
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

    setPageError('');
    setDeletingCharacterId(entry.id);

    try {
      await apiRequest<{ success: boolean }>(`/user-characters/${entry.id}`, {
        method: 'DELETE',
        token: accessToken,
      });

      await Promise.all([refreshOwnedCharacters(), refreshDashboardSummary()]);

      if (editingCharacterId === entry.id) {
        cancelEditingCharacter();
      }

      toast.success(`${entry.character.name} fue eliminado de tu cuenta.`);
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible eliminar personaje'));
    } finally {
      setDeletingCharacterId(null);
    }
  }

  async function handleChangePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setPageError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      currentPassword: String(formData.get('currentPassword') ?? ''),
      newPassword: String(formData.get('newPassword') ?? ''),
    };

    try {
      const parsed = changePasswordSchema.parse(payload);
      await apiRequest<{ success: boolean; message: string }>(
        '/auth/change-password',
        {
          method: 'POST',
          token: accessToken,
          body: parsed,
        },
      );

      toast.success(
        'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
      );
      form.reset();
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible cambiar la contraseña'),
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
      toast.success('Sesión cerrada.');
    } finally {
      handleLocalLogout();
    }
  }

  const authOptions = [
    {
      value: 'login',
      label: 'Entrar',
      description: 'Accede rápido a tu espacio de trabajo.',
    },
    {
      value: 'register',
      label: 'Crear cuenta',
      description: 'Empieza desde cero sin pasos extra.',
    },
  ] satisfies {
    value: AuthView;
    label: string;
    description: string;
  }[];

  const workspaceOptions = [
    {
      value: 'overview',
      label: 'Resumen',
      description: 'Vista rápida del estado de tu cuenta.',
    },
    {
      value: 'roster',
      label: 'Roster',
      description: 'Agregar, editar y ordenar personajes.',
    },
    {
      value: 'account',
      label: 'Cuenta',
      description: 'Perfil, seguridad y cierre de sesión.',
    },
  ] satisfies {
    value: WorkspaceView;
    label: string;
    description: string;
  }[];
  const workspaceShellClassName = getAppShellClassName('wide');
  const workspaceBackdropClassName = getAppBackdropClassName('workspace');

  return (
    <main className={workspaceShellClassName}>
      <div className={workspaceBackdropClassName} />

      <WindowPanel
        title="Espacio de trabajo OmniGacha"
        subtitle="Decisiones inteligentes para tus pulls sin perderte en hojas de cálculo."
        action={<Badge variant="brand">MVP activo</Badge>}
      >
        <div className={WORKSPACE_HERO_GRID_CLASSNAME}>
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Centro de control
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Planea tu roster, evalúa pulls y simula daño desde una sola mesa
              de trabajo.
            </h1>
          </div>

          {!isAuthHydrated ? (
            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <div className="space-y-3">
                <Skeleton className="h-8 w-36 rounded-full" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-[22px]" />
              </div>
            </div>
          ) : !accessToken ? (
            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    Acceso
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--ink-900)]">
                    Entra a tu espacio de trabajo
                  </h2>
                </div>

                <SegmentedTabs
                  value={authView}
                  onValueChange={setAuthView}
                  options={authOptions}
                />

                {pageError ? (
                  <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {pageError}
                  </div>
                ) : null}

                {authView === 'register' ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event) => handleAuthSubmit(event, 'register')}
                  >
                    <Input name="name" placeholder="Nombre" required />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Correo"
                      required
                    />
                    <PasswordInput
                      name="password"
                      placeholder="Contraseña (8+)"
                      required
                    />
                    <Button type="submit" className="w-full">
                      Crear cuenta
                    </Button>
                  </form>
                ) : null}

                {authView === 'login' ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event) => handleAuthSubmit(event, 'login')}
                  >
                    <Input
                      name="email"
                      type="email"
                      placeholder="Correo"
                      required
                    />
                    <PasswordInput
                      name="password"
                      placeholder="Contraseña"
                      required
                    />
                    <Button type="submit" className="w-full">
                      Iniciar sesión
                    </Button>
                  </form>
                ) : null}

              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Sesión activa
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--ink-900)]">
                {me ? `${me.name}, tu mesa está lista.` : 'Tu cuenta está lista.'}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                Usa las ventanas de abajo para editar el roster, revisar el
                tablero o saltar al simulador sin salir del flujo.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/simulator" className="w-full">
                  Abrir simulador
                </ButtonLink>
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
                  Cuenta
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
                  {me?.email}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-600)]">
                  Último puntaje visible:{' '}
                  {dashboardSummary?.lastRecommendation?.score ?? 'sin datos'}.
                </p>
              </div>
            </div>
          )}
        </div>
      </WindowPanel>

      {!isAuthHydrated || !accessToken ? null : (
        <>
          <SegmentedTabs
            value={resolvedWorkspaceView}
            onValueChange={setWorkspaceView}
            options={workspaceOptions}
          />

          {resolvedWorkspaceView === 'overview' ? (
            <section className={WORKSPACE_OVERVIEW_GRID_CLASSNAME}>
              <WindowPanel
                title="Panel de control"
                subtitle="Tu resumen rápido para decidir el siguiente movimiento."
              >
                {pageError ? (
                  <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {pageError}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                      Estado
                    </p>
                    <p className="mt-2 text-3xl font-black text-[var(--ink-900)]">
                      {dashboardSummary?.totalCharacters ?? myCharacters.length}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-600)]">
                      personajes listos para análisis y simulación.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ButtonLink href="/simulator" className="w-full">
                      Ir al simulador
                    </ButtonLink>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setWorkspaceView('roster')}
                    >
                      Gestionar roster
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
                    El tablero y el roster ahora están separados por
                    ventanas. La idea es que abras solo el contexto que
                    necesitas, no toda la página a la vez.
                  </div>
                </div>
              </WindowPanel>

              <WindowPanel
                title="Tablero"
              >
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Personajes
                    </p>
                    {dashboardSummary ? (
                      <p className="mt-3 text-3xl font-black text-[var(--ink-900)]">
                        {dashboardSummary.totalCharacters}
                      </p>
                    ) : (
                      <Skeleton className="mt-3 h-10 w-20 rounded-xl" />
                    )}
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Recomendaciones
                    </p>
                    {dashboardSummary ? (
                      <p className="mt-3 text-3xl font-black text-[var(--ink-900)]">
                        {dashboardSummary.totalRecommendations}
                      </p>
                    ) : (
                      <Skeleton className="mt-3 h-10 w-20 rounded-xl" />
                    )}
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Simulaciones
                    </p>
                    {dashboardSummary ? (
                      <p className="mt-3 text-3xl font-black text-[var(--ink-900)]">
                        {dashboardSummary.totalSimulations}
                      </p>
                    ) : (
                      <Skeleton className="mt-3 h-10 w-20 rounded-xl" />
                    )}
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Última recomendación
                    </p>
                    {!dashboardSummary ? (
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-4 w-32 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    ) : dashboardSummary.lastRecommendation ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold text-[var(--ink-900)]">
                          {dashboardSummary.lastRecommendation.characterName} ·{' '}
                          {dashboardSummary.lastRecommendation.score}
                        </p>
                        <Badge
                          variant={recommendationLevelToBadgeVariant(
                            dashboardSummary.lastRecommendation.recommendation,
                          )}
                        >
                          {dashboardSummary.lastRecommendation.recommendation}
                        </Badge>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--ink-500)]">
                        Aún no tienes recomendaciones guardadas.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setWorkspaceView('roster')}
                  >
                    Registrar personaje
                  </Button>
                  <ButtonLink href="/simulator" variant="ghost">
                    Abrir análisis
                  </ButtonLink>
                  <ButtonLink href="/simulator#scenario-simulation" variant="ghost">
                    Simular daño
                  </ButtonLink>
                </div>
              </WindowPanel>
            </section>
          ) : null}

          {resolvedWorkspaceView === 'roster' ? (
            <section className={WORKSPACE_ROSTER_GRID_CLASSNAME}>
              <WindowPanel
                title={editingEntry && editingForm ? 'Editar personaje' : 'Agregar personaje'}
                subtitle={
                  editingEntry && editingForm
                    ? `Actualiza ${editingEntry.character.name} sin salir del panel.`
                    : 'Selecciona un personaje base y guarda una versión propia.'
                }
              >
                {editingEntry && editingForm ? (
                  <UserCharacterForm
                    catalog={catalog}
                    lightCones={lightCones}
                    selectedCharacter={editingEntry.character}
                    values={editingForm}
                    onSubmit={handleUpdateCharacter}
                    onFieldChange={handleEditingFormFieldChange}
                    onStatFieldChange={handleEditingFormStatFieldChange}
                    submitLabel="Guardar cambios"
                    isSubmitting={isUpdatingCharacter}
                    showStatsByDefault
                    disableCharacterSelect
                    characterPath={editingEntry.character.path}
                    onCancel={cancelEditingCharacter}
                  />
                ) : (
                  <UserCharacterForm
                    catalog={catalog}
                    lightCones={lightCones}
                    selectedCharacter={selectedCharacter}
                    values={createForm}
                    onSubmit={handleCreateCharacter}
                    onFieldChange={handleCreateFormFieldChange}
                    onStatFieldChange={handleCreateFormStatFieldChange}
                    submitLabel="Agregar a mi cuenta"
                    isSubmitting={isCreatingCharacter}
                    showManualToggle
                    useManualStats={useManualStats}
                    onUseManualStatsChange={handleManualStatsToggle}
                    characterPath={selectedCharacter?.path ?? null}
                  />
                )}
              </WindowPanel>

              <WindowPanel
                title="Roster guardado"
                subtitle="Todo tu inventario visible en una sola ventana."
                action={
                  <Badge variant="neutral">
                    {myCharacters.length} personaje
                    {myCharacters.length === 1 ? '' : 's'}
                  </Badge>
                }
              >
                {myCharacters.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-6 text-sm text-[var(--ink-500)]">
                    Aún no tienes personajes registrados.
                  </div>
                ) : (
                  <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
                    {myCharacters.map((entry) => (
                      <article
                        key={entry.id}
                        className={`rounded-2xl border p-4 transition ${
                          editingCharacterId === entry.id
                            ? 'border-[var(--brand-400)] bg-[var(--surface)] shadow-[0_0_0_1px_var(--brand-200)]'
                            : 'border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-base font-semibold text-[var(--ink-900)]">
                              {entry.character.name}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="brand">{entry.character.element}</Badge>
                              <Badge variant="outline">{entry.character.path}</Badge>
                              <Badge variant="neutral">{entry.character.role}</Badge>
                            </div>
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
                              className="text-rose-300 ring-rose-500/35 hover:bg-rose-500/10 focus-visible:ring-rose-400"
                              disabled={deletingCharacterId === entry.id}
                              onClick={() => handleDeleteCharacter(entry)}
                            >
                              {deletingCharacterId === entry.id
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </Button>
                          </div>
                        </div>
                        <p className="mt-4 text-xs font-medium tracking-wide text-[var(--ink-700)]">
                          LVL {entry.level} · E{entry.eidolon} ·{' '}
                          {formatRosterSummary(entry)}
                        </p>
                        <p className="mt-2 text-xs text-[var(--ink-500)]">
                          {entry.lightCone?.name || entry.lightConeName
                            ? `Cono: ${entry.lightCone?.name ?? entry.lightConeName}${entry.lightConeLevel ? ` · Nivel ${entry.lightConeLevel}` : ''}`
                            : 'Sin cono de luz registrado'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </WindowPanel>
            </section>
          ) : null}

          {resolvedWorkspaceView === 'account' ? (
            <section className={WORKSPACE_ACCOUNT_GRID_CLASSNAME}>
              <WindowPanel
                title="Perfil"
                subtitle="Datos base y accesos de navegación."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
                      Usuario
                    </p>
                    <p className="mt-2 text-xl font-bold text-[var(--ink-900)]">
                      {me?.name ?? 'Sin nombre'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-600)]">
                      {me?.email ?? 'Sin correo'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ButtonLink href="/simulator" className="w-full">
                      Abrir simulador
                    </ButtonLink>
                    <Button variant="ghost" className="w-full" onClick={handleLogout}>
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              </WindowPanel>

              <WindowPanel
                title="Seguridad"
                subtitle="Cambia la contraseña desde un flujo corto y aislado."
              >
                {me?.mustChangePassword ? (
                  <div className="mb-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Tu cuenta fue creada con una contraseña temporal. Te
                    recomendamos actualizarla antes de seguir trabajando.
                  </div>
                ) : null}

                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={handleChangePasswordSubmit}
                >
                  <div className="md:col-span-2">
                    <Input
                      name="currentPassword"
                      type="password"
                      placeholder="Contraseña actual"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      name="newPassword"
                      type="password"
                      placeholder="Nueva contraseña (8+)"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button type="submit">Actualizar contraseña</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setWorkspaceView('overview')}
                    >
                      Volver al resumen
                    </Button>
                  </div>
                </form>
              </WindowPanel>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
