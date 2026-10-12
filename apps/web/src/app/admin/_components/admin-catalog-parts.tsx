import Image from 'next/image';
import { ReactNode } from 'react';
import { getInitials } from '../../../components/characters/character-portrait';
import { Badge } from '../../../components/ui/badge';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { buildApiAssetUrl } from '../../../lib/api';
import {
  CATALOG_STATUSES,
  CatalogStatus,
  catalogStatusVariant,
  getRarityLabel,
  getStatusBadgeText,
} from './admin-catalog-helpers';

const RARITIES = [1, 2, 3, 4, 5];

type CatalogRecord = {
  name: string;
  slug: string;
  status: CatalogStatus;
  splashArtUrl?: string | null;
};

function CatalogThumb({ record }: { record: CatalogRecord }) {
  const src = buildApiAssetUrl(record.splashArtUrl);

  return (
    <div className="relative grid h-20 w-14 shrink-0 place-items-center overflow-hidden border border-line-soft bg-[linear-gradient(180deg,#2a2160,#151034)]">
      {src ? (
        <Image
          src={src}
          alt={record.name}
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="text-sm font-extrabold tracking-[0.04em] text-[#e6dcff]">
          {getInitials(record.name)}
        </span>
      )}
    </div>
  );
}

export function CatalogStatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <Badge variant={catalogStatusVariant(status)} dot>
      {getStatusBadgeText(status)}
    </Badge>
  );
}

/** Insignia del modo del editor: estado del registro o "Nuevo" si se está creando. */
export function EditorModeBadge({ record }: { record: CatalogRecord | null }) {
  return record ? (
    <CatalogStatusBadge status={record.status} />
  ) : (
    <Badge variant="brand">Nuevo</Badge>
  );
}

export function SplashBadge({ record }: { record: CatalogRecord }) {
  return record.splashArtUrl ? (
    <Badge variant="success">Splash</Badge>
  ) : (
    <Badge variant="warning">Sin splash</Badge>
  );
}

type CatalogListItemProps = {
  record: CatalogRecord;
  /** Insignias propias de la entidad (elemento, vía, rareza...). */
  badges: ReactNode;
  footnote?: ReactNode;
};

/** Fila de lista común a personajes, conos y relic sets. */
export function CatalogListItem({ record, badges, footnote }: CatalogListItemProps) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <CatalogThumb record={record} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">
            {record.name}
          </span>
          <CatalogStatusBadge status={record.status} />
        </div>
        <p className="truncate text-xs text-muted">{record.slug}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">{badges}</div>
        {footnote ? (
          <p className="line-clamp-2 pt-1 text-[11px] text-muted">{footnote}</p>
        ) : null}
      </div>
    </div>
  );
}

// Campos que comparten todos los formularios del catálogo. Sus `name` coinciden
// con las claves que leen los constructores de payload.

export function NameField({ defaultValue }: { defaultValue?: string }) {
  return (
    <Field label="Nombre">
      <Input
        name="name"
        defaultValue={defaultValue ?? ''}
        placeholder="Nombre visible"
        required
      />
    </Field>
  );
}

export function SlugField({ defaultValue }: { defaultValue?: string }) {
  return (
    <Field label="Slug" hint="Opcional. Si lo dejas vacío, el backend lo genera.">
      <Input name="slug" defaultValue={defaultValue ?? ''} placeholder="slug-del-registro" />
    </Field>
  );
}

export function RarityField({ defaultValue = 5 }: { defaultValue?: number }) {
  return (
    <Field label="Rareza">
      <Select name="rarity" defaultValue={defaultValue}>
        {RARITIES.map((rarity) => (
          <option key={rarity} value={rarity}>
            {getRarityLabel(rarity)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function StatusField({
  defaultValue = 'DRAFT',
}: {
  defaultValue?: CatalogStatus;
}) {
  return (
    <Field label="Estado">
      <Select name="status" defaultValue={defaultValue}>
        {CATALOG_STATUSES.map((status) => (
          <option key={status} value={status}>
            {getStatusBadgeText(status)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function GameVersionField({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <Field label="Versión del juego">
      <Input name="gameVersion" defaultValue={defaultValue ?? ''} placeholder="3.8" />
    </Field>
  );
}
