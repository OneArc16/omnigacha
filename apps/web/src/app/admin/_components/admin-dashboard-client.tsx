"use client";

import Image from 'next/image';
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { Input } from '../../../components/ui/input';
import { SegmentedTabs } from '../../../components/ui/segmented-tabs';
import { Skeleton } from '../../../components/ui/skeleton';
import { Textarea } from '../../../components/ui/textarea';
import { WindowPanel } from '../../../components/ui/window-panel';
import {
  clearAuthTokens,
  useAuthTokens,
  useHydratedValue,
} from '../../../lib/auth-storage';
import {
  apiRequest,
  AdminDashboardSummaryResponse,
  AdminUserRecord,
  buildApiAssetUrl,
  Character,
  CursorPage,
  LightCone,
  MeResponse,
  RelicSet,
} from '../../../lib/api';
import {
  ADMIN_EDITOR_GRID_CLASSNAME,
  ADMIN_PANEL_HERO_GRID_CLASSNAME,
  ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME,
  ADMIN_SUMMARY_METRICS_GRID_CLASSNAME,
  getAdminBackdropClassName,
  getAdminShellClassName,
} from './admin-layout';

type MainSection = 'summary' | 'users' | 'catalog';
type CatalogSection = 'characters' | 'light-cones' | 'artifacts' | 'ornaments';

const PAGE_SIZE = 25;

const SELECT_CLASSNAME =
  'w-full rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)] transition focus:border-[var(--brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]';

const SECTION_OPTIONS = [
  {
    value: 'summary',
    label: 'Resumen',
    description: 'Métricas y estado general del panel.',
  },
  {
    value: 'users',
    label: 'Usuarios',
    description: 'Alta, edición y control de acceso.',
  },
  {
    value: 'catalog',
    label: 'Catálogo',
    description: 'Personajes, conos y sets editoriales.',
  },
] satisfies {
  value: MainSection;
  label: string;
  description: string;
}[];

const CATALOG_OPTIONS = [
  {
    value: 'characters',
    label: 'Personajes',
    description: 'Gestión de personajes y splash art.',
  },
  {
    value: 'light-cones',
    label: 'Conos',
    description: 'Gestión de conos de luz.',
  },
  {
    value: 'artifacts',
    label: 'Artefactos',
    description: 'Sets de piezas de artefacto.',
  },
  {
    value: 'ornaments',
    label: 'Ornamentos',
    description: 'Sets de ornamento planar.',
  },
] satisfies {
  value: CatalogSection;
  label: string;
  description: string;
}[];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesQuery(source: string[], query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  return source.some((value) => normalizeText(value).includes(normalizedQuery));
}

function upsertById<T extends { id: number }>(items: T[], item: T) {
  const next = items.filter((current) => current.id !== item.id);
  next.push(item);
  next.sort((left, right) => left.id - right.id);
  return next;
}

function formatDateTime(value?: string) {
  if (!value) return 'sin fecha';

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function catalogStatusVariant(status: Character['status']) {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'ARCHIVED':
      return 'danger';
    case 'DRAFT':
    default:
      return 'warning';
  }
}

function userRoleVariant(role: AdminUserRecord['role']) {
  return role === 'ADMIN' ? 'brand' : 'neutral';
}

function relicSetTypeVariant(type: RelicSet['type']) {
  return type === 'ARTIFACT' ? 'brand' : 'outline';
}

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

function readRequiredText(formData: FormData, field: string, label: string) {
  const value = readText(formData, field);

  if (!value) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value;
}

function readOptionalText(formData: FormData, field: string) {
  const value = readText(formData, field);
  return value.length > 0 ? value : undefined;
}

function readBoolean(formData: FormData, field: string) {
  const value = formData.get(field);
  return value === 'on' || value === 'true';
}

function readNumber(
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

function getStatusBadgeText(
  status: Character['status'] | LightCone['status'] | RelicSet['status'],
) {
  switch (status) {
    case 'PUBLISHED':
      return 'Publicado';
    case 'ARCHIVED':
      return 'Archivado';
    case 'DRAFT':
    default:
      return 'Borrador';
  }
}

function getRarityLabel(rarity: number) {
  return `${rarity}★`;
}

function getMainSectionLabel(section: MainSection) {
  switch (section) {
    case 'users':
      return 'Usuarios';
    case 'catalog':
      return 'Catalogo';
    case 'summary':
    default:
      return 'Resumen';
  }
}

function getCatalogSectionLabel(section: CatalogSection) {
  switch (section) {
    case 'light-cones':
      return 'Conos';
    case 'artifacts':
      return 'Artefactos';
    case 'ornaments':
      return 'Ornamentos';
    case 'characters':
    default:
      return 'Personajes';
  }
}

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

function Field({ label, hint, children, className = '' }: FieldProps) {
  return (
    <label className={['block space-y-2', className].join(' ')}>
      <span className="text-sm font-semibold text-[var(--ink-900)]">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-[var(--ink-500)]">{hint}</span> : null}
    </label>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
};

function CheckboxField({
  name,
  label,
  hint,
  defaultChecked = false,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/70 p-4 transition hover:border-[var(--line-strong)]">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[var(--line)] bg-[var(--surface-3)] text-[var(--brand-500)] focus:ring-[var(--brand-200)]"
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-[var(--ink-900)]">
          {label}
        </span>
        {hint ? <span className="block text-xs text-[var(--ink-500)]">{hint}</span> : null}
      </span>
    </label>
  );
}

type EntityListProps<T extends { id: number }> = {
  items: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

function EntityList<T extends { id: number }>({
  items,
  selectedId,
  onSelect,
  search,
  onSearch,
  searchPlaceholder,
  emptyText,
  renderItem,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: EntityListProps<T>) {
  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={searchPlaceholder}
      />

      <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
        {items.length > 0 ? (
          items.map((item) => {
            const selected = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={selected}
                className={[
                  'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)]',
                  selected
                    ? 'border-[var(--brand-400)] bg-[color-mix(in_oklab,var(--brand-500)_10%,var(--surface))] shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-400)_38%,transparent)]'
                    : 'border-[var(--line)] bg-[var(--surface-2)]/75 hover:border-[var(--line-strong)] hover:bg-[var(--surface)]',
                ].join(' ')}
              >
                {renderItem(item)}
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)]/60 px-4 py-8 text-sm text-[var(--ink-500)]">
            {emptyText}
          </div>
        )}
      </div>

      {hasMore && onLoadMore ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Cargando...' : 'Cargar más'}
        </Button>
      ) : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: number | string;
  caption: string;
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
};

function MetricCard({
  label,
  value,
  caption,
  tone = 'neutral',
}: MetricCardProps) {
  const toneBackground = {
    brand:
      'linear-gradient(135deg, color-mix(in oklab, var(--brand-500) 18%, transparent), transparent)',
    neutral:
      'linear-gradient(135deg, color-mix(in oklab, var(--ink-500) 10%, transparent), transparent)',
    success:
      'linear-gradient(135deg, color-mix(in oklab, var(--positive-500) 18%, transparent), transparent)',
    warning:
      'linear-gradient(135deg, color-mix(in oklab, var(--warning-500) 18%, transparent), transparent)',
  }[tone];

  return (
    <div
      className={[
        'rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] p-4 shadow-[0_12px_28px_-24px_rgba(2,8,23,.9)]',
      ].join(' ')}
      style={{
        backgroundImage:
          'linear-gradient(180deg, color-mix(in oklab, var(--surface-elevated) 35%, transparent), var(--surface-2)), ' +
          toneBackground,
      }}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[var(--ink-900)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-600)]">{caption}</p>
    </div>
  );
}

type CompactMetricCardProps = {
  label: string;
  value: number | string;
  caption: string;
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
};

function CompactMetricCard({
  label,
  value,
  caption,
  tone = 'neutral',
}: CompactMetricCardProps) {
  const toneRing = {
    brand: 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand-400)_28%,transparent)]',
    neutral:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink-500)_18%,transparent)]',
    success:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--positive-500)_26%,transparent)]',
    warning:
      'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--warning-500)_26%,transparent)]',
  }[tone];

  return (
    <div
      className={[
        'rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/90 p-4',
        toneRing,
      ].join(' ')}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[var(--ink-900)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-600)]">{caption}</p>
    </div>
  );
}

type CatalogThumbProps = {
  src?: string | null;
  alt: string;
  placeholder: string;
};

function CatalogThumb({ src, alt, placeholder }: CatalogThumbProps) {
  const resolvedSrc = buildApiAssetUrl(src);

  if (!resolvedSrc) {
    return (
      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--brand-500)_20%,transparent),var(--surface-2))] px-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)]">
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

type SplashArtCardProps = {
  title: string;
  emptyMessage: string;
  item?: {
    id: number;
    name: string;
    slug: string;
    splashArtUrl?: string | null;
    splashArtAssetId?: number | null;
  } | null;
  onUpload: (formData: FormData) => Promise<void>;
  onRemove: () => Promise<void>;
  isUploading: boolean;
};

function SplashArtCard({
  title,
  emptyMessage,
  item,
  onUpload,
  onRemove,
  isUploading,
}: SplashArtCardProps) {
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
        </div>
        {item ? (
          <Badge variant={item.splashArtAssetId ? 'success' : 'warning'}>
            {item.splashArtAssetId ? 'Con imagen' : 'Sin imagen'}
          </Badge>
        ) : null}
      </div>

      {item ? (
        <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)]">
        {item.splashArtUrl ? (
          <div className="relative h-60 w-full">
            <Image
              src={buildApiAssetUrl(item.splashArtUrl) ?? ''}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center px-4 text-center text-sm text-[var(--ink-500)]">
            Todavia no hay splash art asociado.
          </div>
        )}
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              try {
                await onUpload(formData);
                event.currentTarget.reset();
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
                {isUploading ? 'Subiendo...' : 'Subir splash art'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  void onRemove();
                }}
                disabled={isUploading || !item.splashArtAssetId}
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

export function AdminDashboardClient() {
  const { accessToken, refreshToken } = useAuthTokens();
  const isHydrated = useHydratedValue();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummaryResponse | null>(
    null,
  );
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersNextCursor, setUsersNextCursor] = useState<number | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersNextCursor, setCharactersNextCursor] = useState<
    number | null
  >(null);
  const [lightCones, setLightCones] = useState<LightCone[]>([]);
  const [lightConesNextCursor, setLightConesNextCursor] = useState<
    number | null
  >(null);
  const [relicSets, setRelicSets] = useState<RelicSet[]>([]);
  const [relicSetsNextCursor, setRelicSetsNextCursor] = useState<
    number | null
  >(null);

  const [panelState, setPanelState] = useState<
    'idle' | 'loading' | 'ready' | 'forbidden' | 'error'
  >('idle');
  const [loadError, setLoadError] = useState('');
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const [activeSection, setActiveSection] = useState<MainSection>('summary');
  const [activeCatalogSection, setActiveCatalogSection] =
    useState<CatalogSection>('characters');

  const [userSearch, setUserSearch] = useState('');
  const [characterSearch, setCharacterSearch] = useState('');
  const [lightConeSearch, setLightConeSearch] = useState('');
  const [artifactSearch, setArtifactSearch] = useState('');
  const [ornamentSearch, setOrnamentSearch] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null,
  );
  const [selectedLightConeId, setSelectedLightConeId] = useState<number | null>(
    null,
  );
  const [selectedArtifactSetId, setSelectedArtifactSetId] = useState<
    number | null
  >(null);
  const [selectedOrnamentSetId, setSelectedOrnamentSetId] = useState<
    number | null
  >(null);

  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [isLoadingMoreCharacters, setIsLoadingMoreCharacters] = useState(false);
  const [isLoadingMoreLightCones, setIsLoadingMoreLightCones] = useState(false);
  const [isLoadingMoreRelicSets, setIsLoadingMoreRelicSets] = useState(false);

  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingCharacter, setIsSavingCharacter] = useState(false);
  const [isSavingLightCone, setIsSavingLightCone] = useState(false);
  const [isSavingRelicSet, setIsSavingRelicSet] = useState(false);
  const [isUploadingSplashArt, setIsUploadingSplashArt] = useState(false);

  const resetWorkspace = useCallback(() => {
    setMe(null);
    setSummary(null);
    setUsers([]);
    setUsersNextCursor(null);
    setCharacters([]);
    setCharactersNextCursor(null);
    setLightCones([]);
    setLightConesNextCursor(null);
    setRelicSets([]);
    setRelicSetsNextCursor(null);
    setPanelState('idle');
    setLoadError('');
    setActiveSection('summary');
    setActiveCatalogSection('characters');
    setUserSearch('');
    setCharacterSearch('');
    setLightConeSearch('');
    setArtifactSearch('');
    setOrnamentSearch('');
    setSelectedUserId(null);
    setSelectedCharacterId(null);
    setSelectedLightConeId(null);
    setSelectedArtifactSetId(null);
    setSelectedOrnamentSetId(null);
  }, []);

  function handleLocalLogout() {
    resetWorkspace();
    clearAuthTokens();
  }

  async function loadMoreUsers() {
    if (!accessToken || usersNextCursor === null) return;

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

  async function loadMoreCharacters() {
    if (!accessToken || charactersNextCursor === null) return;

    setIsLoadingMoreCharacters(true);
    try {
      const page = await apiRequest<CursorPage<Character>>(
        `/admin/characters?limit=${PAGE_SIZE}&cursor=${charactersNextCursor}`,
        { token: accessToken },
      );

      setCharacters((current) => [...current, ...page.items]);
      setCharactersNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más personajes.',
      );
    } finally {
      setIsLoadingMoreCharacters(false);
    }
  }

  async function loadMoreLightCones() {
    if (!accessToken || lightConesNextCursor === null) return;

    setIsLoadingMoreLightCones(true);
    try {
      const page = await apiRequest<CursorPage<LightCone>>(
        `/admin/light-cones?limit=${PAGE_SIZE}&cursor=${lightConesNextCursor}`,
        { token: accessToken },
      );

      setLightCones((current) => [...current, ...page.items]);
      setLightConesNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más conos de luz.',
      );
    } finally {
      setIsLoadingMoreLightCones(false);
    }
  }

  async function loadMoreRelicSets() {
    if (!accessToken || relicSetsNextCursor === null) return;

    setIsLoadingMoreRelicSets(true);
    try {
      const page = await apiRequest<CursorPage<RelicSet>>(
        `/admin/relic-sets?limit=${PAGE_SIZE}&cursor=${relicSetsNextCursor}`,
        { token: accessToken },
      );

      setRelicSets((current) => [...current, ...page.items]);
      setRelicSetsNextCursor(page.nextCursor);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar más relic sets.',
      );
    } finally {
      setIsLoadingMoreRelicSets(false);
    }
  }

  async function refreshSummary() {
    if (!accessToken) return;

    const nextSummary = await apiRequest<AdminDashboardSummaryResponse>(
      '/admin/dashboard/summary',
      { token: accessToken },
    );

    setSummary(nextSummary);
  }

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!accessToken) {
      return;
    }

    let active = true;

    async function bootstrap() {
      setPanelState('loading');
      setLoadError('');

      try {
        const profile = await apiRequest<MeResponse>('/auth/me', {
          token: accessToken,
        });

        if (!active) {
          return;
        }

        setMe(profile);

        if (profile.role !== 'ADMIN') {
          setPanelState('forbidden');
          return;
        }

        const [summaryResponse, usersPage, charactersPage, lightConesPage, relicSetsPage] =
          await Promise.all([
            apiRequest<AdminDashboardSummaryResponse>('/admin/dashboard/summary', {
              token: accessToken,
            }),
            apiRequest<CursorPage<AdminUserRecord>>(
              `/admin/users?limit=${PAGE_SIZE}`,
              { token: accessToken },
            ),
            apiRequest<CursorPage<Character>>(
              `/admin/characters?limit=${PAGE_SIZE}`,
              { token: accessToken },
            ),
            apiRequest<CursorPage<LightCone>>(
              `/admin/light-cones?limit=${PAGE_SIZE}`,
              { token: accessToken },
            ),
            apiRequest<CursorPage<RelicSet>>(
              `/admin/relic-sets?limit=${PAGE_SIZE}`,
              { token: accessToken },
            ),
          ]);

        if (!active) {
          return;
        }

        setSummary(summaryResponse);
        setUsers(usersPage.items);
        setUsersNextCursor(usersPage.nextCursor);
        setCharacters(charactersPage.items);
        setCharactersNextCursor(charactersPage.nextCursor);
        setLightCones(lightConesPage.items);
        setLightConesNextCursor(lightConesPage.nextCursor);
        setRelicSets(relicSetsPage.items);
        setRelicSetsNextCursor(relicSetsPage.nextCursor);
        setPanelState('ready');
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar el panel administrativo.',
        );
        setPanelState('error');
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, bootstrapNonce, isHydrated, resetWorkspace]);

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ??
    null;

  const selectedLightCone =
    lightCones.find((lightCone) => lightCone.id === selectedLightConeId) ??
    null;

  const artifactSets = useMemo(
    () => relicSets.filter((relicSet) => relicSet.type === 'ARTIFACT'),
    [relicSets],
  );
  const ornamentSets = useMemo(
    () => relicSets.filter((relicSet) => relicSet.type === 'ORNAMENT'),
    [relicSets],
  );

  const selectedArtifactSet =
    artifactSets.find((relicSet) => relicSet.id === selectedArtifactSetId) ??
    null;
  const selectedOrnamentSet =
    ornamentSets.find((relicSet) => relicSet.id === selectedOrnamentSetId) ??
    null;

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesQuery([user.name, user.email, user.role], userSearch),
      ),
    [users, userSearch],
  );

  const filteredCharacters = useMemo(
    () =>
      characters.filter((character) =>
        matchesQuery(
          [
            character.name,
            character.slug,
            character.element,
            character.path,
            character.role,
            character.status,
          ],
          characterSearch,
        ),
      ),
    [characterSearch, characters],
  );

  const filteredLightCones = useMemo(
    () =>
      lightCones.filter((lightCone) =>
        matchesQuery(
          [
            lightCone.name,
            lightCone.slug,
            lightCone.path,
            lightCone.status,
            lightCone.rarity.toString(),
          ],
          lightConeSearch,
        ),
      ),
    [lightConeSearch, lightCones],
  );

  const filteredArtifactSets = useMemo(
    () =>
      artifactSets.filter((relicSet) =>
        matchesQuery(
          [
            relicSet.name,
            relicSet.slug,
            relicSet.type,
            relicSet.status,
            relicSet.rarity.toString(),
          ],
          artifactSearch,
        ),
      ),
    [artifactSearch, artifactSets],
  );

  const filteredOrnamentSets = useMemo(
    () =>
      ornamentSets.filter((relicSet) =>
        matchesQuery(
          [
            relicSet.name,
            relicSet.slug,
            relicSet.type,
            relicSet.status,
            relicSet.rarity.toString(),
          ],
          ornamentSearch,
        ),
      ),
    [ornamentSearch, ornamentSets],
  );

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } catch {
      // Logout should still clear the local session state if the network fails.
    } finally {
      handleLocalLogout();
      toast.success('Sesión cerrada.');
    }
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

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
      void refreshSummary().catch(() => undefined);
      toast.success(
        selectedUser ? 'Usuario actualizado.' : 'Usuario creado.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el usuario.',
      );
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleCharacterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setIsSavingCharacter(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        element: readRequiredText(formData, 'element', 'Elemento'),
        path: readRequiredText(formData, 'path', 'Camino'),
        role: readRequiredText(formData, 'role', 'Rol'),
        baseHp: readNumber(formData, 'baseHp', 'HP base', {
          required: false,
          integer: true,
          min: 0,
        }),
        baseAtk: readNumber(formData, 'baseAtk', 'ATK base', {
          integer: true,
          min: 0,
        }),
        baseDef: readNumber(formData, 'baseDef', 'DEF base', {
          required: false,
          integer: true,
          min: 0,
        }),
        baseCritRate: readNumber(formData, 'baseCritRate', 'Prob. CRIT', {
          min: 0,
        }),
        baseCritDamage: readNumber(formData, 'baseCritDamage', 'Daño CRIT', {
          min: 0,
        }),
        baseSpeed: readNumber(formData, 'baseSpeed', 'Velocidad base', {
          integer: true,
          min: 0,
        }),
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const gameVersion = readOptionalText(formData, 'gameVersion');

      if (slug) {
        payload.slug = slug;
      }

      if (gameVersion) {
        payload.gameVersion = gameVersion;
      }

      const response = selectedCharacter
        ? await apiRequest<Character>(
            `/admin/characters/${selectedCharacter.id}`,
            {
              method: 'PATCH',
              token: accessToken,
              body: payload,
            },
          )
        : await apiRequest<Character>('/admin/characters', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success(
        selectedCharacter ? 'Personaje actualizado.' : 'Personaje creado.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el personaje.',
      );
    } finally {
      setIsSavingCharacter(false);
    }
  }

  async function handleCharacterArchive() {
    if (!accessToken || !selectedCharacter) return;

    const shouldArchive = window.confirm(
      `Archivar a ${selectedCharacter.name}?`,
    );
    if (!shouldArchive) return;

    setIsSavingCharacter(true);

    try {
      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Personaje archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el personaje.',
      );
    } finally {
      setIsSavingCharacter(false);
    }
  }

  async function handleCharacterSplashUpload(formData: FormData) {
    if (!accessToken || !selectedCharacter) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/splash-art`,
        {
          method: 'POST',
          token: accessToken,
          body: payload,
        },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Splash art de personaje actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleCharacterSplashRemove() {
    if (!accessToken || !selectedCharacter) return;
    if (!selectedCharacter.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<Character>(
        `/admin/characters/${selectedCharacter.id}/splash-art`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setCharacters((current) => upsertById(current, response));
      setSelectedCharacterId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Splash art eliminado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la imagen.',
      );
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleLightConeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setIsSavingLightCone(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        path: readRequiredText(formData, 'path', 'Camino'),
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const effectDescription = readOptionalText(formData, 'effectDescription');
      if (slug) {
        payload.slug = slug;
      }
      if (effectDescription) {
        payload.effectDescription = effectDescription;
      }

      const response = selectedLightCone
        ? await apiRequest<LightCone>(`/admin/light-cones/${selectedLightCone.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<LightCone>('/admin/light-cones', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success(
        selectedLightCone ? 'Cono actualizado.' : 'Cono de luz creado.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el cono de luz.',
      );
    } finally {
      setIsSavingLightCone(false);
    }
  }

  async function handleLightConeArchive() {
    if (!accessToken || !selectedLightCone) return;

    const shouldArchive = window.confirm(
      `Archivar a ${selectedLightCone.name}?`,
    );
    if (!shouldArchive) return;

    setIsSavingLightCone(true);

    try {
      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Cono archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el cono de luz.',
      );
    } finally {
      setIsSavingLightCone(false);
    }
  }

  async function handleLightConeSplashUpload(formData: FormData) {
    if (!accessToken || !selectedLightCone) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}/splash-art`,
        {
          method: 'POST',
          token: accessToken,
          body: payload,
        },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Splash art del cono actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleLightConeSplashRemove() {
    if (!accessToken || !selectedLightCone) return;
    if (!selectedLightCone.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<LightCone>(
        `/admin/light-cones/${selectedLightCone.id}/splash-art`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setLightCones((current) => upsertById(current, response));
      setSelectedLightConeId(response.id);
      void refreshSummary().catch(() => undefined);
      toast.success('Splash art eliminado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la imagen.',
      );
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleRelicSetSubmit(
    event: FormEvent<HTMLFormElement>,
    type: RelicSet['type'],
  ) {
    event.preventDefault();
    if (!accessToken) return;

    setIsSavingRelicSet(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        name: readRequiredText(formData, 'name', 'Nombre'),
        type,
        rarity: readNumber(formData, 'rarity', 'Rareza', {
          integer: true,
          min: 1,
          max: 5,
        }),
        twoPieceBonus: readRequiredText(
          formData,
          'twoPieceBonus',
          'Bonus de 2 piezas',
        ),
        status: readText(formData, 'status') || 'DRAFT',
      };

      const slug = readOptionalText(formData, 'slug');
      const fourPieceBonus = readOptionalText(formData, 'fourPieceBonus');
      const gameVersion = readOptionalText(formData, 'gameVersion');

      if (slug) {
        payload.slug = slug;
      }

      if (fourPieceBonus) {
        payload.fourPieceBonus = fourPieceBonus;
      }

      if (gameVersion) {
        payload.gameVersion = gameVersion;
      }

      const selectedRecord =
        type === 'ARTIFACT' ? selectedArtifactSet : selectedOrnamentSet;

      const response = selectedRecord
        ? await apiRequest<RelicSet>(`/admin/relic-sets/${selectedRecord.id}`, {
            method: 'PATCH',
            token: accessToken,
            body: payload,
          })
        : await apiRequest<RelicSet>('/admin/relic-sets', {
            method: 'POST',
            token: accessToken,
            body: payload,
          });

      setRelicSets((current) => upsertById(current, response));

      if (response.type === 'ARTIFACT') {
        setSelectedArtifactSetId(response.id);
      } else {
        setSelectedOrnamentSetId(response.id);
      }

      void refreshSummary().catch(() => undefined);
      toast.success(
        selectedRecord ? 'Relic set actualizado.' : 'Relic set creado.',
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el relic set.',
      );
    } finally {
      setIsSavingRelicSet(false);
    }
  }

  async function handleRelicSetArchive(type: RelicSet['type']) {
    if (!accessToken) return;

    const selectedRecord =
      type === 'ARTIFACT' ? selectedArtifactSet : selectedOrnamentSet;
    if (!selectedRecord) return;

    const shouldArchive = window.confirm(`Archivar a ${selectedRecord.name}?`);
    if (!shouldArchive) return;

    setIsSavingRelicSet(true);

    try {
      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setRelicSets((current) => upsertById(current, response));

      if (response.type === 'ARTIFACT') {
        setSelectedArtifactSetId(response.id);
      } else {
        setSelectedOrnamentSetId(response.id);
      }

      void refreshSummary().catch(() => undefined);
      toast.success('Relic set archivado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible archivar el relic set.',
      );
    } finally {
      setIsSavingRelicSet(false);
    }
  }

  async function handleRelicSetSplashUpload(formData: FormData, type: RelicSet['type']) {
    if (!accessToken) return;

    const selectedRecord =
      type === 'ARTIFACT' ? selectedArtifactSet : selectedOrnamentSet;

    if (!selectedRecord) return;

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen válida.');
    }

    setIsUploadingSplashArt(true);

    try {
      const payload = new FormData();
      payload.set('file', file);

      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}/splash-art`,
        {
          method: 'POST',
          token: accessToken,
          body: payload,
        },
      );

      setRelicSets((current) => upsertById(current, response));

      if (response.type === 'ARTIFACT') {
        setSelectedArtifactSetId(response.id);
      } else {
        setSelectedOrnamentSetId(response.id);
      }

      void refreshSummary().catch(() => undefined);
      toast.success('Splash art actualizado.');
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  async function handleRelicSetSplashRemove(type: RelicSet['type']) {
    if (!accessToken) return;

    const selectedRecord =
      type === 'ARTIFACT' ? selectedArtifactSet : selectedOrnamentSet;

    if (!selectedRecord?.splashArtAssetId) return;

    setIsUploadingSplashArt(true);

    try {
      const response = await apiRequest<RelicSet>(
        `/admin/relic-sets/${selectedRecord.id}/splash-art`,
        {
          method: 'DELETE',
          token: accessToken,
        },
      );

      setRelicSets((current) => upsertById(current, response));

      if (response.type === 'ARTIFACT') {
        setSelectedArtifactSetId(response.id);
      } else {
        setSelectedOrnamentSetId(response.id);
      }

      void refreshSummary().catch(() => undefined);
      toast.success('Splash art eliminado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la imagen.',
      );
    } finally {
      setIsUploadingSplashArt(false);
    }
  }

  const selectedUserMode = selectedUser ? 'Edición' : 'Nuevo usuario';
  const selectedCharacterMode = selectedCharacter ? 'Edición' : 'Nuevo personaje';
  const selectedLightConeMode = selectedLightCone ? 'Edición' : 'Nuevo cono';
  const selectedArtifactMode = selectedArtifactSet
    ? 'Edición'
    : 'Nuevo artefacto';
  const selectedOrnamentMode = selectedOrnamentSet
    ? 'Edición'
    : 'Nuevo ornamento';
  const activeSectionLabel = getMainSectionLabel(activeSection);
  const activeCatalogSectionLabel = getCatalogSectionLabel(activeCatalogSection);
  const totalCatalogItems =
    (summary?.totalCharacters ?? 0) +
    (summary?.totalLightCones ?? 0) +
    (summary?.totalRelicSets ?? 0);
  const totalDraftItems =
    (summary?.draftCharacters ?? 0) +
    (summary?.draftLightCones ?? 0) +
    (summary?.draftRelicSets ?? 0);
  const wideShellClassName = getAdminShellClassName('wide');
  const compactShellClassName = getAdminShellClassName('compact');
  const heroBackdropClassName = getAdminBackdropClassName('hero');
  const compactBackdropClassName = getAdminBackdropClassName('compact');

  if (!isHydrated) {
    return (
      <main className={wideShellClassName}>
        <div className={heroBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Cargando la interfaz administrativa."
          action={<Badge variant="neutral">Inicializando</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded-full" />
              <Skeleton className="h-14 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Necesitas iniciar sesión como administrador para acceder al backoffice."
          action={<Badge variant="warning">Acceso requerido</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Backoffice nativo
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--ink-900)] sm:text-5xl">
                Gestiona usuarios y catálogo sin salir de OmniGacha.
              </h1>
              <p className="max-w-3xl text-base text-[var(--ink-600)]">
                El acceso administrativo está protegido por rol. En este
                espacio podrás crear usuarios, mantener el catálogo editorial y
                preparar splash art para el futuro front visual.
              </p>
            </div>

            <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    Qué podrás hacer
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-600)]">
                    Crear y editar usuarios, personajes, conos de luz y sets de
                    artefactos/ornamentos.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ButtonLink href="/" className="w-full">
                    Ir al espacio principal
                  </ButtonLink>
                  <ButtonLink href="/simulator" variant="ghost" className="w-full">
                    Abrir simulador
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'loading' || panelState === 'idle') {
    return (
      <main className={wideShellClassName}>
        <div className={heroBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Recuperando datos del backoffice."
          action={<Badge variant="brand">Sincronizando</Badge>}
        >
          <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded-full" />
              <Skeleton className="h-14 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl sm:col-span-2" />
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'error') {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="No pudimos cargar el backoffice."
          action={<Badge variant="danger">Error</Badge>}
        >
          <div className="space-y-4">
            <Alert tone="error">{loadError}</Alert>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setBootstrapNonce((current) => current + 1)}
              >
                Reintentar
              </Button>
              <ButtonLink href="/" variant="ghost">
                Ir al espacio principal
              </ButtonLink>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  if (panelState === 'forbidden') {
    return (
      <main className={compactShellClassName}>
        <div className={compactBackdropClassName} />

        <WindowPanel
          title="Panel de administración OmniGacha"
          subtitle="Tu sesión está activa, pero no tiene permisos administrativos."
          action={<Badge variant="warning">Sin permisos</Badge>}
        >
          <div className="space-y-4">
            <Alert tone="error">
              Esta cuenta no tiene rol ADMIN. Si necesitas entrar al backoffice,
              usa una cuenta administrativa.
            </Alert>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                Sesión actual
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--ink-900)]">
                {me?.name ?? 'Usuario autenticado'}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                {me?.email ?? 'Correo no disponible'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/" className="w-full sm:w-auto">
                Volver al espacio principal
              </ButtonLink>
              <Button type="button" variant="ghost" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </WindowPanel>
      </main>
    );
  }

  const adminTabs = (
    <SegmentedTabs
      value={activeSection}
      onValueChange={setActiveSection}
      options={SECTION_OPTIONS}
    />
  );

  function renderSummaryView() {
    return (
      <WindowPanel
        title="Resumen administrativo"
        subtitle="Métricas vivas para tomar decisiones sin abrir el motor de datos."
        action={<Badge variant="brand">Vista global</Badge>}
      >
        <div className="space-y-6">
          <div className={ADMIN_SUMMARY_METRICS_GRID_CLASSNAME}>
            <MetricCard
              label="Usuarios"
              value={summary?.totalUsers ?? 0}
              caption={`Admins activos: ${summary?.totalActiveAdmins ?? 0}`}
              tone="brand"
            />
            <MetricCard
              label="Personajes"
              value={summary?.totalCharacters ?? 0}
              caption={`Borradores: ${summary?.draftCharacters ?? 0}`}
            />
            <MetricCard
              label="Conos de luz"
              value={summary?.totalLightCones ?? 0}
              caption={`Borradores: ${summary?.draftLightCones ?? 0}`}
            />
            <MetricCard
              label="Relic sets"
              value={summary?.totalRelicSets ?? 0}
              caption={`Borradores: ${summary?.draftRelicSets ?? 0}`}
            />
            <MetricCard
              label="Media assets"
              value={summary?.totalMediaAssets ?? 0}
              caption="Splash art preparado para el front."
              tone="success"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveSection('users')}
            >
              Gestionar usuarios
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveSection('catalog')}
            >
              Abrir catálogo
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
            El catálogo se mantiene en estado editorial. Puedes preparar
            contenido en draft, publicar por etapas y cargar imágenes de splash
            art sin tocar el front público.
          </div>
        </div>
      </WindowPanel>
    );
  }

  function renderUsersView() {
    return (
      <WindowPanel
        title="Gestión de usuarios"
        subtitle="Crea usuarios, ajusta roles y controla el acceso al backoffice."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{filteredUsers.length} visibles</Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedUserId(null)}
            >
              Nuevo
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {summary && summary.totalActiveAdmins <= 1 ? (
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
              emptyText="No hay usuarios que coincidan con tu búsqueda."
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
                  <Input
                    name="password"
                    type="password"
                    placeholder="Nueva contraseña"
                  />
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
                    defaultChecked={
                      selectedUser?.mustChangePassword ?? true
                    }
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

  function renderCharacterView() {
    return (
      <WindowPanel
        title="Gestión de personajes"
        subtitle="Mantén el catálogo editorial y prepara el splash art para el front."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{filteredCharacters.length} visibles</Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedCharacterId(null)}
            >
              Nuevo
            </Button>
          </div>
        }
      >
        <div className={ADMIN_EDITOR_GRID_CLASSNAME}>
          <div>
            <EntityList
              items={filteredCharacters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              search={characterSearch}
              onSearch={setCharacterSearch}
              searchPlaceholder="Buscar por nombre, slug, rol o elemento"
              emptyText="No hay personajes que coincidan con tu búsqueda."
              hasMore={charactersNextCursor !== null}
              onLoadMore={() => {
                void loadMoreCharacters();
              }}
              isLoadingMore={isLoadingMoreCharacters}
              renderItem={(character) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={character.splashArtUrl}
                    alt={character.name}
                    placeholder={character.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {character.name}
                      </span>
                      <Badge variant={catalogStatusVariant(character.status)}>
                        {getStatusBadgeText(character.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {character.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="brand">{character.element}</Badge>
                      <Badge variant="outline">{character.path}</Badge>
                      <Badge variant="neutral">{character.role}</Badge>
                      <Badge variant="success">
                        {getRarityLabel(character.rarity)}
                      </Badge>
                    </div>
                    <p className="pt-1 text-[11px] text-[var(--ink-500)]">
                      ATK {character.baseAtk} · DEF {character.baseDef} · SPD{' '}
                      {character.baseSpeed}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedCharacter?.id ?? 'new-character'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleCharacterSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedCharacterMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedCharacter ? selectedCharacter.name : 'Crear personaje'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    Los splash art se suben desde el panel lateral para no
                    mezclar media con los datos del personaje.
                  </p>
                </div>
                {selectedCharacter ? (
                  <Badge variant={catalogStatusVariant(selectedCharacter.status)}>
                    {getStatusBadgeText(selectedCharacter.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedCharacter?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. Si lo dejas vacío, el backend lo genera."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedCharacter?.slug ?? ''}
                    placeholder="personaje-slug"
                  />
                </Field>
                <Field label="Elemento">
                  <Input
                    name="element"
                    defaultValue={selectedCharacter?.element ?? ''}
                    placeholder="Fire, Ice, Quantum..."
                    required
                  />
                </Field>
                <Field label="Camino">
                  <Input
                    name="path"
                    defaultValue={selectedCharacter?.path ?? ''}
                    placeholder="Destruction, Harmony..."
                    required
                  />
                </Field>
                <Field label="Rol">
                  <Input
                    name="role"
                    defaultValue={selectedCharacter?.role ?? ''}
                    placeholder="DPS, support..."
                    required
                  />
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedCharacter?.rarity ?? 5}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </Field>
                <Field label="Versión del juego">
                  <Input
                    name="gameVersion"
                    defaultValue={selectedCharacter?.gameVersion ?? ''}
                    placeholder="3.8"
                  />
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedCharacter?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="HP base">
                  <Input
                    name="baseHp"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseHp ?? 0}
                  />
                </Field>
                <Field label="ATK base">
                  <Input
                    name="baseAtk"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseAtk ?? 0}
                    required
                  />
                </Field>
                <Field label="DEF base">
                  <Input
                    name="baseDef"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseDef ?? 0}
                  />
                </Field>
                <Field label="Prob. CRIT">
                  <Input
                    name="baseCritRate"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={selectedCharacter?.baseCritRate ?? 0}
                    required
                  />
                </Field>
                <Field label="Daño CRIT">
                  <Input
                    name="baseCritDamage"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={selectedCharacter?.baseCritDamage ?? 0}
                    required
                  />
                </Field>
                <Field label="Velocidad base">
                  <Input
                    name="baseSpeed"
                    type="number"
                    min={0}
                    defaultValue={selectedCharacter?.baseSpeed ?? 0}
                    required
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingCharacter}>
                  {isSavingCharacter ? 'Guardando...' : 'Guardar personaje'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedCharacterId(null)}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleCharacterArchive()}
                  disabled={!selectedCharacter}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <SplashArtCard
              key={`character-${selectedCharacter?.id ?? 'empty'}-${selectedCharacter?.splashArtAssetId ?? 'none'}`}
              title="Splash art de personaje"
              emptyMessage="Selecciona un personaje para subir o quitar su splash art."
              item={selectedCharacter}
              onUpload={handleCharacterSplashUpload}
              onRemove={handleCharacterSplashRemove}
              isUploading={isUploadingSplashArt}
            />
          </div>
        </div>
      </WindowPanel>
    );
  }

  function renderLightConeView() {
    return (
      <WindowPanel
        title="Gestión de conos de luz"
        subtitle="Mantén el catálogo listo para el front y para futuras fichas visuales."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{filteredLightCones.length} visibles</Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedLightConeId(null)}
            >
              Nuevo
            </Button>
          </div>
        }
      >
        <div className={ADMIN_EDITOR_GRID_CLASSNAME}>
          <div>
            <EntityList
              items={filteredLightCones}
              selectedId={selectedLightConeId}
              onSelect={setSelectedLightConeId}
              search={lightConeSearch}
              onSearch={setLightConeSearch}
              searchPlaceholder="Buscar por nombre, slug, camino o rareza"
              emptyText="No hay conos de luz que coincidan con tu búsqueda."
              hasMore={lightConesNextCursor !== null}
              onLoadMore={() => {
                void loadMoreLightCones();
              }}
              isLoadingMore={isLoadingMoreLightCones}
              renderItem={(lightCone) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={lightCone.splashArtUrl}
                    alt={lightCone.name}
                    placeholder={lightCone.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {lightCone.name}
                      </span>
                      <Badge variant={catalogStatusVariant(lightCone.status)}>
                        {getStatusBadgeText(lightCone.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {lightCone.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="brand">{lightCone.path}</Badge>
                      <Badge variant="success">
                        {getRarityLabel(lightCone.rarity)}
                      </Badge>
                      {lightCone.splashArtUrl ? (
                        <Badge variant="success">Splash</Badge>
                      ) : (
                        <Badge variant="warning">Sin splash</Badge>
                      )}
                    </div>
                    {lightCone.effectDescription ? (
                      <p className="line-clamp-2 pt-1 text-[11px] text-[var(--ink-500)]">
                        {lightCone.effectDescription}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={selectedLightCone?.id ?? 'new-light-cone'}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={handleLightConeSubmit}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedLightConeMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedLightCone ? selectedLightCone.name : 'Crear cono de luz'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    La media se sube en el panel lateral para mantener el flujo
                    de edición limpio.
                  </p>
                </div>
                {selectedLightCone ? (
                  <Badge variant={catalogStatusVariant(selectedLightCone.status)}>
                    {getStatusBadgeText(selectedLightCone.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedLightCone?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. El backend genera uno si lo dejas vacío."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedLightCone?.slug ?? ''}
                    placeholder="cono-de-luz"
                  />
                </Field>
                <Field label="Camino">
                  <Input
                    name="path"
                    defaultValue={selectedLightCone?.path ?? ''}
                    placeholder="Harmony, Hunt..."
                    required
                  />
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedLightCone?.rarity ?? 5}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedLightCone?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <Field
                label="Descripción del efecto"
                hint="Opcional, pero recomendado para completar la ficha del objeto."
              >
                <Textarea
                  name="effectDescription"
                  defaultValue={selectedLightCone?.effectDescription ?? ''}
                  placeholder="Describe el efecto principal del cono..."
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingLightCone}>
                  {isSavingLightCone ? 'Guardando...' : 'Guardar cono'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedLightConeId(null)}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleLightConeArchive()}
                  disabled={!selectedLightCone}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <SplashArtCard
              key={`light-cone-${selectedLightCone?.id ?? 'empty'}-${selectedLightCone?.splashArtAssetId ?? 'none'}`}
              title="Splash art de cono"
              emptyMessage="Selecciona un cono de luz para gestionar su imagen."
              item={selectedLightCone}
              onUpload={handleLightConeSplashUpload}
              onRemove={handleLightConeSplashRemove}
              isUploading={isUploadingSplashArt}
            />
          </div>
        </div>
      </WindowPanel>
    );
  }

  function renderRelicSetView(type: RelicSet['type']) {
    const isArtifact = type === 'ARTIFACT';
    const selectedRecord = isArtifact ? selectedArtifactSet : selectedOrnamentSet;
    const filteredItems = isArtifact ? filteredArtifactSets : filteredOrnamentSets;
    const search = isArtifact ? artifactSearch : ornamentSearch;
    const onSearch = isArtifact ? setArtifactSearch : setOrnamentSearch;
    const selectedId = isArtifact ? selectedArtifactSetId : selectedOrnamentSetId;
    const onSelect = isArtifact ? setSelectedArtifactSetId : setSelectedOrnamentSetId;
    const selectedMode = isArtifact ? selectedArtifactMode : selectedOrnamentMode;
    const emptyText = isArtifact
      ? 'No hay artefactos que coincidan con tu búsqueda.'
      : 'No hay ornamentos que coincidan con tu búsqueda.';
    const panelTitle = isArtifact ? 'Gestión de artefactos' : 'Gestión de ornamentos';
    const panelSubtitle = isArtifact
      ? 'Administra sets de artefacto y deja listas sus imágenes.'
      : 'Administra sets de ornamento planar y deja listas sus imágenes.';
    const hasMore = relicSetsNextCursor !== null;
    const listCount = filteredItems.length;

    return (
      <WindowPanel
        title={panelTitle}
        subtitle={panelSubtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{listCount} visibles</Badge>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (isArtifact) {
                  setSelectedArtifactSetId(null);
                } else {
                  setSelectedOrnamentSetId(null);
                }
              }}
            >
              Nuevo
            </Button>
          </div>
        }
      >
        <div className={ADMIN_EDITOR_GRID_CLASSNAME}>
          <div>
            <EntityList
              items={filteredItems}
              selectedId={selectedId}
              onSelect={onSelect}
              search={search}
              onSearch={onSearch}
              searchPlaceholder={
                isArtifact
                  ? 'Buscar por nombre, slug, tipo o rareza'
                  : 'Buscar por nombre, slug, tipo o rareza'
              }
              emptyText={emptyText}
              hasMore={hasMore}
              onLoadMore={() => {
                void loadMoreRelicSets();
              }}
              isLoadingMore={isLoadingMoreRelicSets}
              renderItem={(relicSet) => (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CatalogThumb
                    src={relicSet.splashArtUrl}
                    alt={relicSet.name}
                    placeholder={relicSet.name.slice(0, 2).toUpperCase()}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                        {relicSet.name}
                      </span>
                      <Badge variant={catalogStatusVariant(relicSet.status)}>
                        {getStatusBadgeText(relicSet.status)}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--ink-500)]">
                      {relicSet.slug}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant={relicSetTypeVariant(relicSet.type)}>
                        {relicSet.type === 'ARTIFACT' ? 'Artefacto' : 'Ornamento'}
                      </Badge>
                      <Badge variant="success">
                        {getRarityLabel(relicSet.rarity)}
                      </Badge>
                      {relicSet.splashArtUrl ? (
                        <Badge variant="success">Splash</Badge>
                      ) : (
                        <Badge variant="warning">Sin splash</Badge>
                      )}
                    </div>
                    <p className="pt-1 text-[11px] text-[var(--ink-500)] line-clamp-2">
                      {relicSet.twoPieceBonus}
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="space-y-4">
            <form
              key={`${type}-${selectedRecord?.id ?? 'new'}`}
              className="space-y-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5"
              onSubmit={(event) => {
                void handleRelicSetSubmit(event, type);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                    {selectedMode}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-[var(--ink-900)]">
                    {selectedRecord
                      ? selectedRecord.name
                      : isArtifact
                        ? 'Crear artefacto'
                        : 'Crear ornamento'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-600)]">
                    Un solo modelo para ambos tipos reduce código duplicado y
                    mantiene la edición consistente.
                  </p>
                </div>
                {selectedRecord ? (
                  <Badge variant={catalogStatusVariant(selectedRecord.status)}>
                    {getStatusBadgeText(selectedRecord.status)}
                  </Badge>
                ) : (
                  <Badge variant="brand">Nuevo</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input
                    name="name"
                    defaultValue={selectedRecord?.name ?? ''}
                    placeholder="Nombre visible"
                    required
                  />
                </Field>
                <Field
                  label="Slug"
                  hint="Opcional. El backend puede generarlo automáticamente."
                >
                  <Input
                    name="slug"
                    defaultValue={selectedRecord?.slug ?? ''}
                    placeholder="slug-del-set"
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    name="type"
                    defaultValue={type}
                    className={SELECT_CLASSNAME}
                    disabled
                  >
                    <option value="ARTIFACT">ARTIFACT</option>
                    <option value="ORNAMENT">ORNAMENT</option>
                  </select>
                </Field>
                <Field label="Rareza">
                  <select
                    name="rarity"
                    defaultValue={selectedRecord?.rarity ?? 5}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </Field>
                <Field label="Versión del juego">
                  <Input
                    name="gameVersion"
                    defaultValue={selectedRecord?.gameVersion ?? ''}
                    placeholder="3.8"
                  />
                </Field>
                <Field label="Estado">
                  <select
                    name="status"
                    defaultValue={selectedRecord?.status ?? 'DRAFT'}
                    className={SELECT_CLASSNAME}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </Field>
              </div>

              <Field label="Bonus de 2 piezas">
                <Textarea
                  name="twoPieceBonus"
                  defaultValue={selectedRecord?.twoPieceBonus ?? ''}
                  placeholder="Describe el bonus de dos piezas..."
                  required
                />
              </Field>

              <Field
                label="Bonus de 4 piezas"
                hint="En ornamentos puedes dejarlo vacío si no aplica."
              >
                <Textarea
                  name="fourPieceBonus"
                  defaultValue={selectedRecord?.fourPieceBonus ?? ''}
                  placeholder="Describe el bonus de cuatro piezas..."
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSavingRelicSet}>
                  {isSavingRelicSet ? 'Guardando...' : 'Guardar relic set'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (isArtifact) {
                      setSelectedArtifactSetId(null);
                    } else {
                      setSelectedOrnamentSetId(null);
                    }
                  }}
                >
                  Limpiar formulario
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleRelicSetArchive(type)}
                  disabled={!selectedRecord}
                >
                  Archivar
                </Button>
              </div>
            </form>

            <SplashArtCard
              key={`relic-set-${type}-${selectedRecord?.id ?? 'empty'}-${selectedRecord?.splashArtAssetId ?? 'none'}`}
              title={isArtifact ? 'Splash art de artefacto' : 'Splash art de ornamento'}
              emptyMessage={
                isArtifact
                  ? 'Selecciona un artefacto para gestionar su imagen.'
                  : 'Selecciona un ornamento para gestionar su imagen.'
              }
              item={selectedRecord}
              onUpload={async (formData) => {
                await handleRelicSetSplashUpload(formData, type);
              }}
              onRemove={async () => {
                await handleRelicSetSplashRemove(type);
              }}
              isUploading={isUploadingSplashArt}
            />
          </div>
        </div>
      </WindowPanel>
    );
  }

  return (
    <main className={wideShellClassName}>
      <div className={heroBackdropClassName} />

      <WindowPanel
        title="Panel de administración OmniGacha"
        subtitle="Backoffice nativo para usuarios, catálogo y media editorial."
        action={<Badge variant="brand">ADMIN</Badge>}
      >
        <div className={ADMIN_PANEL_HERO_GRID_CLASSNAME}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Seccion activa: {activeSectionLabel}</Badge>
              {activeSection === 'catalog' ? (
                <Badge variant="outline">
                  Foco: {activeCatalogSectionLabel}
                </Badge>
              ) : null}
              <Badge variant="success">
                Media: {summary?.totalMediaAssets ?? 0}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CompactMetricCard
                label="Usuarios"
                value={summary?.totalUsers ?? 0}
                caption={`Admins activos: ${summary?.totalActiveAdmins ?? 0}`}
                tone="brand"
              />
              <CompactMetricCard
                label="Catalogo"
                value={totalCatalogItems}
                caption="Personajes, conos y relic sets."
                tone="neutral"
              />
              <CompactMetricCard
                label="Drafts"
                value={totalDraftItems}
                caption="Contenido pendiente por publicar."
                tone="warning"
              />
              <CompactMetricCard
                label="Estado"
                value={me?.mustChangePassword ? 'Atencion' : 'Operativo'}
                caption={
                  me?.mustChangePassword
                    ? 'Conviene actualizar la clave.'
                    : 'Panel listo para gestionar.'
                }
                tone={me?.mustChangePassword ? 'warning' : 'success'}
              />
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]/80 p-4 text-sm text-[var(--ink-600)]">
              Trabaja por secciones para no mezclar usuarios, catalogo y media.
              Los assets siguen en flujo editorial y se publican cuando la ficha
              este lista.
            </div>
          </div>

          <div className="w-full xl:max-w-[34rem] rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                  Sesión activa
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--ink-900)]">
                  {me?.name ?? 'Administrador'}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-600)]">
                  {me?.email ?? 'Correo no disponible'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/" className="w-full">
                  Ir al espacio principal
                </ButtonLink>
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-600)]">
                El panel usa uploads locales en `apps/api/uploads` y guarda solo
                metadatos de media en la base de datos.
              </div>
            </div>
          </div>
        </div>
      </WindowPanel>

      {me?.mustChangePassword ? (
        <Alert tone="error">
          Tu cuenta requiere cambio de contraseña. El acceso al panel sigue
          habilitado, pero conviene resolverlo cuanto antes.
        </Alert>
      ) : null}

      {adminTabs}

      {activeSection === 'summary' ? renderSummaryView() : null}
      {activeSection === 'users' ? renderUsersView() : null}

      {activeSection === 'catalog' ? (
        <>
          <SegmentedTabs
            value={activeCatalogSection}
            onValueChange={setActiveCatalogSection}
            options={CATALOG_OPTIONS}
          />

          {activeCatalogSection === 'characters' ? renderCharacterView() : null}
          {activeCatalogSection === 'light-cones' ? renderLightConeView() : null}
          {activeCatalogSection === 'artifacts'
            ? renderRelicSetView('ARTIFACT')
            : null}
          {activeCatalogSection === 'ornaments'
            ? renderRelicSetView('ORNAMENT')
            : null}
        </>
      ) : null}

      {summary && activeSection === 'summary' ? (
        <section className={ADMIN_SUMMARY_FOOTER_GRID_CLASSNAME}>
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Consejos de operación
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-600)]">
              <li>Trabaja en draft y publica cuando la ficha esté lista.</li>
              <li>Sube splash art al final para mantener la revisión limpia.</li>
              <li>Un solo modelo de relic sets evita duplicar lógica entre artefactos y ornamentos.</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
              Media preparada
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Assets"
                value={summary.totalMediaAssets}
                caption="Imágenes registradas en el sistema."
                tone="success"
              />
              <MetricCard
                label="Seguridad"
                value={summary.totalActiveAdmins}
                caption="Admins activos con acceso real."
                tone="warning"
              />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
