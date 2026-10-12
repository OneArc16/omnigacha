'use client';

import { FormEvent, useState } from 'react';
import { WORKSPACE_OVERVIEW_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PasswordInput } from '../../../components/ui/password-input';
import { SegmentedTabs } from '../../../components/ui/segmented-tabs';
import { StatTile } from '../../../components/ui/stat-tile';
import { WindowPanel } from '../../../components/ui/window-panel';
import { HeaderStrip } from '../../../components/layout/header-strip';
import { Note } from '../../../components/ui/note';
import type { AuthMode, Session } from './use-session';

const AUTH_OPTIONS: { value: AuthMode; label: string }[] = [
  { value: 'login', label: 'Entrar' },
  { value: 'register', label: 'Crear cuenta' },
];

const FEATURES = [
  {
    label: 'Roster',
    step: '01',
    caption: 'Registra tus personajes y conos de luz.',
    accent: 'var(--gold)',
  },
  {
    label: 'Recomendaciones',
    step: '02',
    caption: 'Evalúa si un pull vale la pena.',
    accent: 'var(--purple)',
  },
  {
    label: 'Simulaciones',
    step: '03',
    caption: 'Compara daño antes de invertir.',
    accent: 'var(--cyan)',
  },
];

type GuestLandingProps = {
  error: string;
  onSignIn: Session['signIn'];
};

export function GuestLanding({ error, onSignIn }: GuestLandingProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    const succeeded = await onSignIn(mode, {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });
    setIsSubmitting(false);

    if (succeeded) form.reset();
  }

  return (
    <>
      <HeaderStrip
        glyph="✦"
        eyebrow="Trazador · Sin sesión"
        title="Tu mesa de trabajo te espera"
        description="Planea tu roster, evalúa pulls y simula daño desde una sola mesa."
      />

      <section className={`mt-1 ${WORKSPACE_OVERVIEW_GRID_CLASSNAME}`}>
        <WindowPanel
          title="Acceso"
          subtitle="Entra a tu espacio de trabajo."
        >
          <div className="space-y-4">
            <SegmentedTabs value={mode} onValueChange={setMode} options={AUTH_OPTIONS} />

            {error ? <Alert tone="error">{error}</Alert> : null}

            <form className="space-y-3" onSubmit={handleSubmit}>
              {isRegister ? (
                <Input name="name" placeholder="Nombre" required />
              ) : null}
              <Input name="email" type="email" placeholder="Correo" required />
              <PasswordInput
                name="password"
                placeholder={isRegister ? 'Contraseña (8+)' : 'Contraseña'}
                required
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>
        </WindowPanel>

        <WindowPanel
          title="Centro de control"
          subtitle="Decisiones inteligentes para tus pulls sin perderte en hojas de cálculo."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <StatTile
                key={feature.label}
                label={feature.label}
                value={feature.step}
                caption={feature.caption}
                accent={feature.accent}
              />
            ))}
          </div>
          <Note className="mt-3.5">
            Inicia sesión para ver tu tablero, gestionar tu roster y abrir el
            simulador con los datos de tu cuenta.
          </Note>
        </WindowPanel>
      </section>
    </>
  );
}
