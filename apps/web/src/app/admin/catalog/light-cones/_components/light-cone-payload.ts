import {
  readCatalogBasePayload,
  readOptionalField,
} from '../../../_components/admin-catalog-helpers';
import { readRequiredText } from '../../../_components/admin-form-utils';

export function buildLightConePayload(formData: FormData) {
  return {
    ...readCatalogBasePayload(formData),
    path: readRequiredText(formData, 'path', 'Camino'),
    ...readOptionalField(formData, 'effectDescription'),
  };
}
