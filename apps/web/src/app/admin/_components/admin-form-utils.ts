export function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

export function readRequiredText(formData: FormData, field: string, label: string) {
  const value = readText(formData, field);

  if (!value) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value;
}

export function readOptionalText(formData: FormData, field: string) {
  const value = readText(formData, field);
  return value.length > 0 ? value : undefined;
}

export function readBoolean(formData: FormData, field: string) {
  const value = formData.get(field);
  return value === 'on' || value === 'true';
}

export function readNumber(
  formData: FormData,
  field: string,
  label: string,
  options: {
    required?: boolean;
    integer?: boolean;
    min?: number;
    max?: number;
  } = {},
) {
  const rawValue = readText(formData, field);

  if (!rawValue) {
    if (options.required === false) {
      return undefined;
    }

    throw new Error(`${label} es obligatorio.`);
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} debe ser un número válido.`);
  }

  if (options.integer && !Number.isInteger(value)) {
    throw new Error(`${label} debe ser un número entero.`);
  }

  if (typeof options.min === 'number' && value < options.min) {
    throw new Error(`${label} debe ser mayor o igual a ${options.min}.`);
  }

  if (typeof options.max === 'number' && value > options.max) {
    throw new Error(`${label} debe ser menor o igual a ${options.max}.`);
  }

  return value;
}
