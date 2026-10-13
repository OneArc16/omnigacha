import {
  readBoolean,
  readOptionalText,
  readRequiredText,
  readText,
} from '../../_components/admin-form-utils';

export function buildUserPayload(formData: FormData, isNew: boolean) {
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
