'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { WindowPanel } from '../../../../components/ui/window-panel';
import {
  AdminDashboardSummaryResponse,
  AdminUserRecord,
  apiRequest,
  CursorPage,
} from '../../../../lib/api';
import { AdminAccessGate } from '../../_components/admin-access-gate';
import { EntityList } from '../../_components/admin-entity-list';
import {
  CheckboxField,
  Field,
  SELECT_CLASSNAME,
} from '../../_components/admin-form-fields';
import {
  readBoolean,
  readOptionalText,
  readRequiredText,
  readText,
} from '../../_components/admin-form-utils';
import { ADMIN_EDITOR_GRID_CLASSNAME } from '../../_components/admin-layout';
import { formatDateTime, matchesQuery, upsertById } from '../../_components/admin-utils';

const PAGE_SIZE = 25;

function userRoleVariant(role: AdminUserRecord['role']) {
  return role === 'ADMIN' ? 'brand' : 'neutral';
}

export function UsersPanel() {
  return (
    <AdminAccessGate
      title="Gestión de usuarios"
      subtitle="Necesitas iniciar sesión como administrador para gestionar usuarios."
    >
      {({ accessToken }) => <UsersWorkspace accessToken={accessToken} />}
    </AdminAccessGate>
  );
}

function UsersWorkspace({ accessToken }: { accessToken: string }) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersNextCursor, setUsersNextCursor] = useState<number | null>(null);
  const [totalActiveAdmins, setTotalActiveAdmins] = useState<number | null>(null);

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoadingUsers(true);
      setLoadError('');

      try {
        const [usersPage, summary] = await Promise.all([
          apiRequest<CursorPage<AdminUserRecord>>(
            `/admin/users?limit=${PAGE_SIZE}`,
            { token: accessToken },
          ),
          apiRequest<AdminDashboardSummaryResponse>('/admin/dashboard/summary', {
            token: accessToken,
          }),
        ]);

        if (!active) return;

        setUsers(usersPage.items);
        setUsersNextCursor(usersPage.nextCursor);
        setTotalActiveAdmins(summary.totalActiveAdmins);
      } catch (error) {
        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los usuarios.',
        );
      } finally {
        if (active) {
          setIsLoadingUsers(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken]);

  async function refreshActiveAdminCount() {
    try {
      const summary = await apiRequest<AdminDashboardSummaryResponse>(
        '/admin/dashboard/summary',
        { token: accessToken },
      );
      setTotalActiveAdmins(summary.totalActiveAdmins);
    } catch {
      // Non-critical: the banner just stays with its last known value.
    }
  }

  async function loadMoreUsers() {
    if (usersNextCursor === null) return;

    setIsLoadingMoreUsers(true);
    try {
      const page = await apiRequest<CursorPage<AdminUserRecord>>(
        `/admin/users?limit=${PAGE_SIZE}&cursor=${usersNextCursor}`,
        { token: accessToken },
      );

      setUsers((current) => [...current, ...page.items]);
      setUsersNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más usuarios.',
      );
    } finally {
      setIsLoadingMoreUsers(false);
    }
  }

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesQuery([user.name, user.email, user.role], userSearch),
      ),
    [users, userSearch],
  );

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const selectedUserMode = selectedUser ? 'Edición' : 'Nuevo usuario';

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingUser(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        email: readRequiredText(formData, 'email', 'Correo'),
        role: readText(formData, 'role') || 'USER',
        isActive: readBoolean(formData, 'isActive'),
        mustChangePassword: readBoolean(formData, 'mustChangePassword'),
      };

      const password = readOptionalText(formData, 'password');
      if (!selectedUser) {
        payload.password = readRequiredText(formData, 'password', 'Contraseña');
      } else if (password) {
        payload.password = password;
      }

      const response = selectedUser
        ? await apiRequest<AdminUserRecord>(`/admin/users/${selectedUser.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<AdminUserRecord>('/admin/users', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setUsers((current) => upsertById(current, response));
      setSelectedUserId(response.id);
      void refreshActiveAdminCount();
      toast.success(selectedUser ? 'Usuario actualizado.' : 'Usuario creado.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No fue posible guardar el usuario.',
      );
    } finally {
      setIsSavingUser(false);
    }
  }

  return (
    <WindowPanel
      title="Gestión de usuarios"
      subtitle="Crea usuarios, ajusta roles y controla el acceso al backoffice."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{filteredUsers.length} visibles</Badge>
          <Button type="button" variant="ghost" onClick={() => setSelectedUserId(null)}>
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

        {totalActiveAdmins !== null && totalActiveAdmins <= 1 ? (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Hay un solo admin activo. No es un fallo del sistema, pero sí un
            riesgo operativo: si desactivas esa cuenta o cambias su rol,
            perderás acceso administrativo.
          </div>
        ) : null}

        <div className={ADMIN_EDITOR_GRID_CLASSNAME}>
          <div>
            <EntityList
              items={filteredUsers}
              selectedId={selectedUserId}
              onSelect={setSelectedUserId}
              search={userSearch}
              onSearch={setUserSearch}
              searchPlaceholder="Buscar por nombre, correo o rol"
              emptyText={
                isLoadingUsers
                  ? 'Cargando usuarios...'
                  : 'No hay usuarios que coincidan con tu búsqueda.'
              }
              hasMore={usersNextCursor !== null}
              onLoadMore={() => {
                void loadMoreUsers();
              }}
              isLoadingMore={isLoadingMoreUsers}
              renderItem={(user) => (
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {user.name}
                      </span>
                      <Badge variant={userRoleVariant(user.role)}>{user.role}</Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {user.mustChangePassword ? (
                        <Badge variant="warning">Cambiar clave</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-[var(--ink-500)]">
                    <p>#{user.id}</p>
                    <p className="mt-1">{formatDateTime(user.updatedAt)}</p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedUser?.id ?? 'new-user'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleUserSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedUserMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedUser ? selectedUser.name : 'Crear nuevo usuario'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    Los usuarios creados desde admin arrancan como cuentas
                    estándar y pueden elevarse a ADMIN si hace falta.
                  </p>
                </div>
                {selectedUser ? (
                  <Badge variant={userRoleVariant(selectedUser.role)}>
                    ID {selectedUser.id}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedUser?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field label="Correo">
                  <Input
                    name="email"
                    type="email"
                    defaultValue={selectedUser?.email ?? ''}
                    placeholder="usuario@correo.com"
                    required
                  />
                </Field>
                <Field
                  label="Contraseña"
                  hint="Obligatoria al crear. En edición puedes dejarla vacía."
                  className="sm:col-span-2"
                >
                  <Input name="password" type="password" placeholder="Nueva contraseña" />
                </Field>
                <Field label="Rol">
                  <select
                    name="role"
                    defaultValue={selectedUser?.role ?? 'USER'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </Field>
                <div className="grid gap-3">
                  <CheckboxField
                    name="isActive"
                    label="Cuenta activa"
                    hint="Desactivar corta acceso al login y refresh."
                    defaultChecked={selectedUser?.isActive ?? true}
                  />
                  <CheckboxField
                    name="mustChangePassword"
                    label="Forzar cambio de clave"
                    hint="Recomendado para altas creadas por administración."
                    defaultChecked={selectedUser?.mustChangePassword ?? true}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingUser}>
                  {isSavingUser ? 'Guardando...' : 'Guardar usuario'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedUserId(null)}
                >
                  Limpiar formulario
                </Button>
              </div>
            </form>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)]/80 p-5 text-sm text-[var(--ink-600)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Buenas prácticas
              </p>
              <ul className="mt-3 space-y-2">
                <li>Un usuario desactivado no debe poder iniciar sesión.</li>
                <li>Evita dejar cero admins activos en producción.</li>
                <li>Si marcas `mustChangePassword`, el login deberá forzar el cambio.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WindowPanel>
  );
}
