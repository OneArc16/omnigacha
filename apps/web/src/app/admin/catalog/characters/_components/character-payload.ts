import type { Character } from '../../../../../lib/api';
import {
  readCatalogBasePayload,
  readOptionalField,
} from '../../../_components/admin-catalog-helpers';
import { readNumber, readRequiredText } from '../../../_components/admin-form-utils';

export type BaseStatField = {
  name: keyof Pick<
    Character,
    'baseHp' | 'baseAtk' | 'baseDef' | 'baseCritRate' | 'baseCritDamage' | 'baseSpeed'
  >;
  label: string;
  required: boolean;
  integer: boolean;
};

/** Stats base del formulario; los mismos datos dibujan los inputs y validan el payload. */
export const BASE_STAT_FIELDS: BaseStatField[] = [
  { name: 'baseHp', label: 'HP base', required: false, integer: true },
  { name: 'baseAtk', label: 'ATK base', required: true, integer: true },
  { name: 'baseDef', label: 'DEF base', required: false, integer: true },
  { name: 'baseCritRate', label: 'Prob. CRIT', required: true, integer: false },
  { name: 'baseCritDamage', label: 'Daño CRIT', required: true, integer: false },
  { name: 'baseSpeed', label: 'Velocidad base', required: true, integer: true },
];

export function buildCharacterPayload(formData: FormData) {
  const baseStats = Object.fromEntries(
    BASE_STAT_FIELDS.map(({ name, label, required, integer }) => [
      name,
      readNumber(formData, name, label, { required, integer, min: 0 }),
    ]),
  );

  return {
    ...readCatalogBasePayload(formData),
    element: readRequiredText(formData, 'element', 'Elemento'),
    path: readRequiredText(formData, 'path', 'Camino'),
    role: readRequiredText(formData, 'role', 'Rol'),
    ...baseStats,
    ...readOptionalField(formData, 'gameVersion'),
  };
}
