import type { RelicSet } from '../../../../lib/api';
import {
  readCatalogBasePayload,
  readOptionalField,
} from '../../_components/admin-catalog-helpers';
import { readRequiredText } from '../../_components/admin-form-utils';

export type RelicSetKind = RelicSet['type'];

/** El tipo no viene del formulario: lo fija la pantalla (artefactos u ornamentos). */
export function buildRelicSetPayload(formData: FormData, type: RelicSetKind) {
  return {
    ...readCatalogBasePayload(formData),
    type,
    twoPieceBonus: readRequiredText(formData, 'twoPieceBonus', 'Bonus de 2 piezas'),
    ...readOptionalField(formData, 'fourPieceBonus'),
    ...readOptionalField(formData, 'gameVersion'),
  };
}
