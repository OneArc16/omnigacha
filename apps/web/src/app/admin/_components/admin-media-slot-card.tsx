import Image from 'next/image';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { buildApiAssetUrl } from '../../../lib/api';
import { Field } from './admin-form-fields';

type MediaSlotCardProps = {
  title: string;
  emptyMessage: string;
  item?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  imageUrl?: string | null;
  assetId?: number | null;
  uploadButtonLabel: string;
  previewAspectClassName?: string;
  hint?: string;
  onUpload: (formData: FormData) => Promise<void>;
  onRemove: () => Promise<void>;
  isUploading: boolean;
};

export function MediaSlotCard({
  title,
  emptyMessage,
  item,
  imageUrl,
  assetId,
  uploadButtonLabel,
  previewAspectClassName = 'h-60',
  hint,
  onUpload,
  onRemove,
  isUploading,
}: MediaSlotCardProps) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface-2)]/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
            {title}
          </p>
          <h3 className="mt-1 text-base font-semibold text-[var(--ink-900)]">
            {item ? item.name : 'Sin selección'}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            {item ? item.slug : emptyMessage}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-[var(--ink-500)]">{hint}</p>
          ) : null}
        </div>
        {item ? (
          <Badge variant={assetId ? 'success' : 'warning'}>
            {assetId ? 'Con imagen' : 'Sin imagen'}
          </Badge>
        ) : null}
      </div>

      {item ? (
        <div className="mt-4 space-y-4">
          <div
            className={`overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] ${previewAspectClassName}`}
          >
            {imageUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={buildApiAssetUrl(imageUrl) ?? ''}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--ink-500)]">
                Todavia no hay imagen asociada.
              </div>
            )}
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);

              try {
                await onUpload(formData);
                form.reset();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'No fue posible subir la imagen.',
                );
              }
            }}
          >
            <Field
              label="Archivo"
              hint="Imágenes PNG, JPG, WEBP, GIF, AVIF o SVG. Límite de 10 MB."
            >
              <Input
                name="file"
                type="file"
                accept="image/*"
                required
                className="file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--ink-900)]"
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Subiendo...' : uploadButtonLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  void onRemove();
                }}
                disabled={isUploading || !assetId}
              >
                Quitar imagen
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-sm text-[var(--ink-500)]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
