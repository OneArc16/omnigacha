'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { CheckboxField } from '../../../../components/ui/checkbox-field';
import { Field } from '../../../../components/ui/field';
import { Input } from '../../../../components/ui/input';
import { Eyebrow, Inset } from '../../../../components/ui/inset';
import { Note } from '../../../../components/ui/note';
import { PasswordInput } from '../../../../components/ui/password-input';
import { Select } from '../../../../components/ui/select';
import { WindowPanel } from '../../../../components/ui/window-panel';
import {
  AdminDashboardSummaryResponse,
  AdminUserRecord,
  apiRequest,
} from '../../../../lib/api';
import { EditorPanel } from '../../_components/admin-editor-panel';
import {
  readBoolean,
  readOptionalText,
  readRequiredText,
  readText,
} from '../../_components/admin-form-utils';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../_components/admin-layout';
import { AdminPage } from '../../_components/admin-page';
import { ResourceListPanel } from '../../_components/admin-resource-list';
import { formatDateTime } from '../../_components/admin-utils';
import {
  AdminResourceLabels,
  useAdminResource,
} from '../../_components/use-admin-resource';

const LABELS: AdminResourceLabels = {
  loadError: 'No fue posible cargar los usuarios.',
  loadMoreError: 'No fue posible cargar más usuarios.',
  created: 'Usuario creado.',
  updated: 'Usuario actualizado.',
  saveError: 'No fue posible guardar el usuario.',
};

const ROLES: AdminUserRecord['role'][] = ['USER', 'ADMIN'];

const GOOD_PRACTICES = [
  'Un usuario desactivado no puede iniciar sesión ni renovar su token.',
  'Evita dejar cero admins activos en producción.',
  'Con el cambio de clave forzado, el login obliga a actualizarla.',
];

function getSearchFields(user: AdminUserRecord) {
  return [user.name, user.email, user.role];
}

function buildUserPayload(formData: FormData, isNew: boolean) {
  // La contraseña es obligatoria al crear y opcional al editar.
  const password = isNew
    ? readRequiredText(formData, 'password', 'Contraseña')
    : readOptionalText(formData, 'password');

  return {
    name: readRequiredText(formData, 'name', 'Nombre'),
    email: readRequiredText(formData, 'email', 'Correo'),
    role: readText(formData, 'role') || 'USER',
    isActive: readBoolean(formData, 'isActive'),
    mustChangePassword: readBoolean(formData, 'mustChangePassword'),
    ...(password ? { password } : {}),
  };
}

/** Admins activos según la API; `null` mientras no se conoce. */
function useActiveAdminCount(accessToken: string) {
  const [count, setCount] = useState<number | null>(null);

  // No es crítico: si falla, el aviso simplemente conserva el último valor.
  const refresh = useCallback(
    () =>
      apiRequest<AdminDashboardSummaryResponse>('/admin/dashboard/summary', {
        token: accessToken,
      })
        .then((summary) => setCount(summary.totalActiveAdmins))
        .catch(() => undefined),
    [accessToken],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { count, refresh };
}

function UserListItem({ user }: { user: AdminUserRecord }) {
  return (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink">{user.name}</span>
          <Badge variant={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{user.role}</Badge>
        </div>
        <p className="truncate text-xs text-muted">{user.email}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant={user.isActive ? 'success' : 'danger'} dot>
            {user.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          {user.mustChangePassword ? (
            <Badge variant="warning">Cambiar clave</Badge>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted">
        <p>#{user.id}</p>
        <p className="mt-1">{formatDateTime(user.updatedAt)}</p>
      </div>
    </div>
  );
}

function UserFields({ user }: { user: AdminUserRecord | null }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <Input
            name="name"
            defaultValue={user?.name ?? ''}
            placeholder="Nombre visible"
            required
          />
        </Field>
        <Field label="Correo">
          <Input
            name="email"
            type="email"
            defaultValue={user?.email ?? ''}
            placeholder="usuario@correo.com"
            required
          />
        </Field>
        <Field
          label="Contraseña"
          hint="Obligatoria al crear. En edición puedes dejarla vacía."
        >
          <PasswordInput name="password" placeholder="Nueva contraseña" />
        </Field>
        <Field label="Rol">
          <Select name="role" defaultValue={user?.role ?? 'USER'}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Inset className="grid gap-4 p-3 sm:grid-cols-2">
        <CheckboxField
          name="isActive"
          label="Cuenta activa"
          hint="Desactivar corta el acceso al login y al refresh."
          defaultChecked={user?.isActive ?? true}
        />
        <CheckboxField
          name="mustChangePassword"
          label="Forzar cambio de clave"
          hint="Recomendado para altas creadas por administración."
          defaultChecked={user?.mustChangePassword ?? true}
        />
      </Inset>
    </>
  );
}

function UsersWorkspace({ accessToken }: { accessToken: string }) {
  const resource = useAdminResource<AdminUserRecord>({
    accessToken,
    path: '/admin/users',
    searchFields: getSearchFields,
    labels: LABELS,
  });
  const activeAdmins = useActiveAdminCount(accessToken);
  const { selected } = resource;

  async function handleSubmit(formData: FormData) {
    const saved = await resource.save(() => buildUserPayload(formData, !selected));
    if (saved) void activeAdmins.refresh();
  }

  return (
    <section className={ADMIN_EDITOR_GRID_CLASSNAME}>
      <ResourceListPanel
        title="Usuarios"
        subtitle="Cuentas con acceso a OmniGacha."
        resource={resource}
        searchPlaceholder="Buscar por nombre, correo o rol"
        emptyText="No hay usuarios que coincidan con tu búsqueda."
        renderItem={(user) => <UserListItem user={user} />}
        notice={
          activeAdmins.count !== null && activeAdmins.count <= 1 ? (
            <Note tone="warning">
              Hay un solo admin activo. Si desactivas esa cuenta o cambias su
              rol, perderás el acceso administrativo.
            </Note>
          ) : null
        }
      />

      <div className="space-y-5">
        <EditorPanel
          title={selected ? selected.name : 'Crear nuevo usuario'}
          subtitle={selected ? 'Edición de la cuenta.' : 'Nueva cuenta.'}
          badge={
            selected ? (
              <Badge variant={selected.role === 'ADMIN' ? 'brand' : 'neutral'}>
                ID {selected.id}
              </Badge>
            ) : (
              <Badge variant="brand">Nuevo</Badge>
            )
          }
          formKey={selected?.id ?? 'new'}
          onSubmit={handleSubmit}
          isSaving={resource.isSaving}
          saveLabel="Guardar usuario"
          onReset={resource.clearSelection}
          note="Los usuarios creados desde admin arrancan como cuentas estándar y pueden elevarse a ADMIN si hace falta."
        >
          <UserFields user={selected} />
        </EditorPanel>

        <WindowPanel title="Buenas prácticas" subtitle="Antes de tocar accesos.">
          <Eyebrow>Recuerda</Eyebrow>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-700)] marker:text-gold">
            {GOOD_PRACTICES.map((practice) => (
              <li key={practice}>{practice}</li>
            ))}
          </ul>
        </WindowPanel>
      </div>
    </section>
  );
}

export function UsersPanel() {
  return (
    <AdminPage
      title="Gestión de usuarios"
      description="Crea usuarios, ajusta roles y controla el acceso al backoffice."
    >
      {({ accessToken }) => <UsersWorkspace accessToken={accessToken} />}
    </AdminPage>
  );
}
