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
import { SegmentedTabs } from '../components/ui/segmented-tabs';
import { Skeleton } from '../components/ui/skeleton';
import { WindowPanel } from '../components/ui/window-panel';
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
  CursorPage,
  DashboardSummaryResponse,
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

type RecommendationLevel =
  NonNullable<DashboardSummaryResponse['lastRecommendation']>['recommendation'];

type AuthView = 'login' | 'register' | 'security';
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
        mode === 'register' ? 'Cuenta creada con exito.' : 'Sesion iniciada.',
      );
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
      const payload = buildUserCharacterPayload(createForm);

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
      const payload = buildUserCharacterPayload(editingForm);
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
    setPageError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
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

      toast.success(
        'Contrasena actualizada. Inicia sesion con tu nueva contrasena.',
      );
      setAuthView('login');
      form.reset();
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible cambiar la contrasena'),
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
      toast.success('Sesion cerrada.');
    } finally {
      handleLocalLogout();
    }
  }

  const authOptions = [
    {
      value: 'login',
      label: 'Entrar',
      description: 'Accede rapido a tu workspace.',
    },
    {
      value: 'register',
      label: 'Crear cuenta',
      description: 'Empieza desde cero sin pasos extra.',
    },
    {
      value: 'security',
      label: 'Recuperar acceso',
      description: 'Actualiza la contrasena por correo.',
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
      description: 'Vista rapida del estado de tu cuenta.',
    },
    {
      value: 'roster',
      label: 'Roster',
      description: 'Agregar, editar y ordenar personajes.',
    },
    {
      value: 'account',
      label: 'Cuenta',
      description: 'Perfil, seguridad y cierre de sesion.',
    },
  ] satisfies {
    value: WorkspaceView;
    label: string;
    description: string;
  }[];

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_15%_20%,rgba(34,193,238,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(180deg,rgba(6,10,21,0.4),transparent)]" />

      <WindowPanel
        title="OmniGacha Workspace"
        subtitle="Decisiones inteligentes para tus pulls sin perderte en hojas de calculo."
        action={<Badge variant="brand">MVP activo</Badge>}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Control room
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Planea tu roster, evalua pulls y simula dano desde una sola mesa
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
                    Entra a tu workspace
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
                    <Input
                      name="password"
                      type="password"
                      placeholder="Contrasena (8+)"
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
                    <Input
                      name="password"
                      type="password"
                      placeholder="Contrasena"
                      required
                    />
                    <Button type="submit" className="w-full">
                      Iniciar sesion
                    </Button>
                  </form>
                ) : null}

                {authView === 'security' ? (
                  <form
                    className="space-y-3"
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
                    <Button type="submit" variant="ghost" className="w-full">
                      Actualizar contrasena
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Sesion activa
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--ink-900)]">
                {me ? `${me.name}, tu mesa esta lista.` : 'Tu cuenta esta lista.'}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                Usa las ventanas de abajo para editar el roster, revisar el
                dashboard o saltar al simulador sin salir del flujo.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/simulator" className="w-full">
                  Abrir simulador
                </ButtonLink>
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  Cerrar sesion
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
                  Ultimo score visible:{' '}
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
            value={workspaceView}
            onValueChange={setWorkspaceView}
            options={workspaceOptions}
          />

          {workspaceView === 'overview' ? (
            <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
              <WindowPanel
                title="Command Deck"
                subtitle="Tu resumen rapido para decidir el siguiente movimiento."
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
                      personajes listos para analisis y simulacion.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ButtonLink href="/simulator" className="w-full">
                      Ir al simulator
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
                    El dashboard y el roster ahora estan separados por
                    ventanas. La idea es que abras solo el contexto que
                    necesitas, no toda la pagina a la vez.
                  </div>
                </div>
              </WindowPanel>

              <WindowPanel
                title="Dashboard"
                subtitle="KPIs y accesos rapidos del MVP."
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
                      Ultima recomendacion
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
                        Aun no tienes recomendaciones guardadas.
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
                    Abrir analisis
                  </ButtonLink>
                  <ButtonLink href="/simulator#scenario-simulation" variant="ghost">
                    Simular dano
                  </ButtonLink>
                </div>
              </WindowPanel>
            </section>
          ) : null}

          {workspaceView === 'roster' ? (
            <section className="grid items-start gap-6 xl:grid-cols-[0.98fr_1.02fr]">
              <WindowPanel
                title={editingEntry && editingForm ? 'Editar personaje' : 'Agregar personaje'}
                subtitle={
                  editingEntry && editingForm
                    ? `Actualiza ${editingEntry.character.name} sin salir del panel.`
                    : 'Selecciona un personaje base y guarda una version propia.'
                }
              >
                {editingEntry && editingForm ? (
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
                ) : (
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
                    Aun no tienes personajes registrados.
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
                          LVL {entry.level} · E{entry.eidolon} · ATK {entry.atk} · CR{' '}
                          {Math.round(entry.critRate * 100)}% · CD{' '}
                          {Math.round(entry.critDamage * 100)}% · SPD {entry.speed}
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

          {workspaceView === 'account' ? (
            <section className="grid items-start gap-6 xl:grid-cols-[0.82fr_1.18fr]">
              <WindowPanel
                title="Perfil"
                subtitle="Datos base y accesos de navegacion."
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
                      Abrir simulator
                    </ButtonLink>
                    <Button variant="ghost" className="w-full" onClick={handleLogout}>
                      Cerrar sesion
                    </Button>
                  </div>
                </div>
              </WindowPanel>

              <WindowPanel
                title="Seguridad"
                subtitle="Cambia la contrasena desde un flujo corto y aislado."
              >
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleChangePasswordSubmit}>
                  <div className="md:col-span-2">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Correo de la cuenta"
                      defaultValue={me?.email ?? ''}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      name="newPassword"
                      type="password"
                      placeholder="Nueva contrasena (8+)"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button type="submit">Actualizar contrasena</Button>
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
