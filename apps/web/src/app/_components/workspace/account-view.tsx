'use client';

import { FormEvent, useState } from 'react';
import { WORKSPACE_ACCOUNT_GRID_CLASSNAME } from '../../../components/layout/page-shell';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { Note } from '../../../components/ui/note';
import { PasswordInput } from '../../../components/ui/password-input';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { MeResponse } from '../../../lib/api';
import type { Session } from './use-session';

type AccountViewProps = {
  me: MeResponse | null;
  onChangePassword: Session['changePassword'];
  onSignOut: () => void;
  onBackToOverview: () => void;
};

export function AccountView({
  me,
  onChangePassword,
  onSignOut,
  onBackToOverview,
}: AccountViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    const succeeded = await onChangePassword({
      currentPassword: String(formData.get('currentPassword') ?? ''),
      newPassword: String(formData.get('newPassword') ?? ''),
    });
    setIsSubmitting(false);

    if (succeeded) form.reset();
  }

  return (
    <section className={`mt-1 ${WORKSPACE_ACCOUNT_GRID_CLASSNAME}`}>
      <WindowPanel title="Perfil" subtitle="Datos base y accesos de navegación.">
        <div className="border border-line-soft surface-inset px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
            Usuario
          </p>
          <p className="mt-1.5 text-[22px] font-bold text-ink">
            {me?.name ?? 'Sin nombre'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {me?.email ?? 'Sin correo'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <ButtonLink href="/simulator" className="w-full px-3 py-3">
            Abrir simulador
          </ButtonLink>
          <Button variant="ghost" className="w-full px-3 py-3" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </WindowPanel>

      <WindowPanel
        title="Seguridad"
        subtitle="Cambia la contraseña desde un flujo corto y aislado."
      >
        {me?.mustChangePassword ? (
          <Note tone="warning" className="mb-4">
            Tu cuenta fue creada con una contraseña temporal. Te recomendamos
            actualizarla antes de seguir trabajando.
          </Note>
        ) : null}

        <form className="max-w-xl space-y-3" onSubmit={handleSubmit}>
          <PasswordInput
            name="currentPassword"
            placeholder="Contraseña actual"
            required
          />
          <PasswordInput
            name="newPassword"
            placeholder="Nueva contraseña (8+)"
            required
          />
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button type="submit" disabled={isSubmitting}>
              Actualizar contraseña
            </Button>
            <Button type="button" variant="ghost" onClick={onBackToOverview}>
              Volver al resumen
            </Button>
          </div>
        </form>
      </WindowPanel>
    </section>
  );
}
