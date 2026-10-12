'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  apiRequest,
  Character,
  CharacterStatKey,
  RecommendationResponse,
  UserCharacter,
} from '../../../lib/api';
import {
  buildCharacterStatsFormValues,
  CharacterStatsFormValues,
  getVisibleCharacterStatKeys,
} from '../../../lib/character-stats';
import { resolveErrorMessage } from '../../../lib/errors';
import { buildStatsPayload } from './simulator-format';

type RecommendationOptions = {
  accessToken: string;
  catalog: Character[];
  owned: UserCharacter[];
  /** Se invoca tras generar una recomendación (p. ej. para refrescar historiales). */
  onCompleted: () => Promise<unknown>;
};

/** Flujo de recomendación de pull: objetivo, stats opcionales y resultado. */
export function useRecommendation({
  accessToken,
  catalog,
  owned,
  onCompleted,
}: RecommendationOptions) {
  const [targetId, setTargetId] = useState<number | null>(null);
  const [useCustomStats, setUseCustomStats] = useState(false);
  const [statInputs, setStatInputs] = useState<CharacterStatsFormValues>(() =>
    buildCharacterStatsFormValues(undefined),
  );
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const target = useMemo(
    () => catalog.find((character) => character.id === targetId) ?? null,
    [catalog, targetId],
  );
  const statKeys = useMemo(() => getVisibleCharacterStatKeys(target), [target]);

  // Los inputs parten del build del roster y, si no lo tienes, del catálogo.
  function selectTarget(nextId: number | null) {
    const ownedEntry = owned.find((entry) => entry.character.id === nextId);
    const catalogEntry = catalog.find((character) => character.id === nextId);

    setTargetId(nextId);
    setStatInputs(
      buildCharacterStatsFormValues(ownedEntry?.stats ?? catalogEntry?.defaultStats),
    );
  }

  function changeStat(statKey: CharacterStatKey, value: string) {
    setStatInputs((current) => ({ ...current, [statKey]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetId) return;

    setIsSubmitting(true);

    try {
      const response = await apiRequest<RecommendationResponse>(
        '/simulations/recommend',
        {
          method: 'POST',
          token: accessToken,
          body: {
            targetCharacterId: targetId,
            targetStats: useCustomStats
              ? buildStatsPayload(statKeys, statInputs)
              : undefined,
          },
        },
      );

      setResult(response);
      toast.success('Recomendación generada con el motor ligero.');
      await onCompleted();
    } catch (err) {
      toast.error(
        resolveErrorMessage(err, 'No fue posible simular la recomendación'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    targetId,
    target,
    statKeys,
    useCustomStats,
    statInputs,
    result,
    isSubmitting,
    selectTarget,
    setUseCustomStats,
    changeStat,
    submit,
  };
}

export type Recommendation = ReturnType<typeof useRecommendation>;
