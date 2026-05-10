'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
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

type Me = {
  id: number;
  name: string;
  email: string;
};

export default function Home() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [me, setMe] = useState<Me | null>(null);
  const [catalog, setCatalog] = useState<Character[]>([]);
  const [myCharacters, setMyCharacters] = useState<UserCharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null,
  );
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const stored = loadAuthTokens();
    if (stored.accessToken) setAccessToken(stored.accessToken);
    if (stored.refreshToken) setRefreshToken(stored.refreshToken);
  }, []);

  useEffect(() => {
    apiRequest<CursorPage<Character>>('/characters?limit=100')
      .then((page) => setCatalog(page.items))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setMe(null);
      setMyCharacters([]);
      return;
    }

    Promise.all([
      apiRequest<Me>('/auth/me', { token: accessToken }),
      apiRequest<CursorPage<UserCharacter>>('/user-characters?limit=100', {
        token: accessToken,
      }),
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
    () => catalog.find((c) => c.id === selectedCharacterId),
    [catalog, selectedCharacterId],
  );

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

  async function handleAddCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selectedCharacter) return;

    setError('');
    setStatus('');

    try {
      await apiRequest<UserCharacter>('/user-characters', {
        method: 'POST',
        token: accessToken,
        body: {
          characterId: selectedCharacter.id,
          level: 80,
          eidolon: 0,
          atk: selectedCharacter.baseAtk,
          critRate: selectedCharacter.baseCritRate,
          critDamage: selectedCharacter.baseCritDamage,
          speed: selectedCharacter.baseSpeed,
        },
      });

      const refreshed = await apiRequest<CursorPage<UserCharacter>>(
        '/user-characters?limit=100',
        {
          token: accessToken,
        },
      );
      setMyCharacters(refreshed.items);
      setStatus(`${selectedCharacter.name} agregado a tu cuenta.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible agregar personaje',
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

  function handleLocalLogout() {
    setAccessToken('');
    setRefreshToken('');
    setMe(null);
    setMyCharacters([]);
    clearAuthTokens();
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
            <form
              className="flex flex-col gap-3 md:flex-row"
              onSubmit={handleAddCharacter}
            >
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2.5 text-sm text-[var(--ink-900)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)] md:min-w-96"
                value={selectedCharacterId ?? ''}
                onChange={(event) =>
                  setSelectedCharacterId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                required
              >
                <option value="">Selecciona un personaje</option>
                {catalog.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name} - {character.element} / {character.path}
                  </option>
                ))}
              </select>
              <Button type="submit">Agregar a mi cuenta</Button>
            </form>
          </Card>

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
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3"
                  >
                    <p className="font-semibold text-[var(--ink-900)]">
                      {entry.character.name}
                    </p>
                    <p className="text-sm text-[var(--ink-500)]">
                      {entry.character.element} / {entry.character.path} /{' '}
                      {entry.character.role}
                    </p>
                    <p className="mt-2 text-xs font-medium tracking-wide text-[var(--ink-700)]">
                      LVL {entry.level} · E{entry.eidolon} · ATK {entry.atk} · SPD{' '}
                      {entry.speed}
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
