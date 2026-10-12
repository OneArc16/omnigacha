'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../../../lib/api';
import { resolveErrorMessage } from '../../../lib/errors';
import type { AdminResource } from './use-admin-resource';

type MediaSlotOptions<T extends { id: number; name: string }> = {
  resource: AdminResource<T>;
  /** Subrecurso de imagen del registro, p. ej. `splash-art` o `portrait`. */
  slot: string;
  labels: {
    uploaded: string;
    removed: string;
  };
};

/** Sube o quita la imagen de un slot del registro seleccionado en la colección. */
export function useAdminMediaSlot<T extends { id: number; name: string }>({
  resource,
  slot,
  labels,
}: MediaSlotOptions<T>) {
  const [isBusy, setIsBusy] = useState(false);
  const { accessToken, path, selected, upsert } = resource;

  async function request(method: 'POST' | 'DELETE', body?: FormData) {
    if (!selected) return false;

    setIsBusy(true);
    try {
      upsert(
        await apiRequest<T>(`${path}/${selected.id}/${slot}`, {
          method,
          token: accessToken,
          body,
        }),
      );
      toast.success(method === 'POST' ? labels.uploaded : labels.removed);
      return true;
    } catch (err) {
      toast.error(
        resolveErrorMessage(
          err,
          method === 'POST'
            ? 'No fue posible subir la imagen.'
            : 'No fue posible eliminar la imagen.',
        ),
      );
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  /** Devuelve `true` si la imagen se subió, para que el formulario pueda limpiarse. */
  async function upload(formData: FormData) {
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      toast.error('Selecciona una imagen válida.');
      return false;
    }

    const payload = new FormData();
    payload.set('file', file);
    return request('POST', payload);
  }

  async function remove() {
    await request('DELETE');
  }

  return { isBusy, upload, remove };
}

export type AdminMediaSlot = ReturnType<typeof useAdminMediaSlot>;
