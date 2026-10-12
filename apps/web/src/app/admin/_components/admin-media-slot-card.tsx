import Image from 'next/image';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { EmptyState } from '../../../components/ui/inset';
import { WindowPanel } from '../../../components/ui/window-panel';
import { buildApiAssetUrl } from '../../../lib/api';
import type { AdminMediaSlot } from './use-admin-media-slot';

type MediaSlotCardProps = {
  title: string;
  emptyMessage: string;
  item: { name: string } | null;
  imageUrl?: string | null;
  uploadButtonLabel: string;
  previewClassName?: string;
  hint?: string;
  media: AdminMediaSlot;
};

export function MediaSlotCard({
  title,
  emptyMessage,
  item,
  imageUrl,
  uploadButtonLabel,
  previewClassName = 'h-60',
  hint,
  media,
}: MediaSlotCardProps) {
  const previewSrc = buildApiAssetUrl(imageUrl);

  return (
    <WindowPanel
      title={title}
      subtitle={item ? item.name : 'Sin selección'}
      action={
        item ? (
          <Badge variant={previewSrc ? 'success' : 'warning'} dot>
            {previewSrc ? 'Con imagen' : 'Sin imagen'}
          </Badge>
        ) : null
      }
    >
      {item ? (
        <div className="space-y-4">
          <div
            className={`relative overflow-hidden border border-line-soft surface-inset ${previewClassName}`}
          >
            {previewSrc ? (
              <Image
                src={previewSrc}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="grid h-full place-items-center px-4 text-center text-sm text-muted">
                Todavía no hay imagen asociada.
              </div>
            )}
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              if (await media.upload(new FormData(form))) form.reset();
            }}
          >
            <Field
              label="Archivo"
              hint={hint ?? 'PNG, JPG, WEBP, GIF, AVIF o SVG. Límite de 10 MB.'}
            >
              <Input
                name="file"
                type="file"
                accept="image/*"
                required
                className="file:mr-3 file:border-0 file:bg-[rgba(233,236,248,.08)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
              />
            </Field>

            <div className="flex flex-wrap gap-2.5">
              <Button type="submit" size="sm" disabled={media.isBusy}>
                {media.isBusy ? 'Procesando...' : uploadButtonLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={media.remove}
                disabled={media.isBusy || !previewSrc}
              >
                Quitar imagen
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </WindowPanel>
  );
}
