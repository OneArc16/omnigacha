'use client';

import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  apiRequest,
  CharacterStatKey,
  DamageScenarioResponse,
  UserCharacter,
} from '../../../lib/api';
import {
  buildCharacterStatsFormValues,
  CharacterStatsFormValues,
  getVisibleCharacterStatKeys,
} from '../../../lib/character-stats';
import { resolveErrorMessage } from '../../../lib/errors';
import { buildStatsPayload } from './simulator-format';

const EMPTY_TEAMMATE_SLOTS = ['', '', ''];

type DamageScenarioOptions = {
  accessToken: string;
  owned: UserCharacter[];
  /** Se invoca tras simular (p. ej. para refrescar el historial). */
  onCompleted: () => Promise<unknown>;
};

/** Flujo de escenario de daño: personaje del roster, equipo opcional y stats finales. */
export function useDamageScenario({
  accessToken,
  owned,
  onCompleted,
}: DamageScenarioOptions) {
  const [characterId, setCharacterId] = useState<number | null>(
    () => owned[0]?.character.id ?? null,
  );
  const [statInputs, setStatInputs] = useState<CharacterStatsFormValues>(() =>
    buildCharacterStatsFormValues(owned[0]?.stats),
  );
  const [useCustomTeam, setUseCustomTeam] = useState(false);
  const [teammateSlots, setTeammateSlots] = useState(EMPTY_TEAMMATE_SLOTS);
  const [result, setResult] = useState<DamageScenarioResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entry = useMemo(
    () => owned.find((item) => item.character.id === characterId) ?? null,
    [owned, characterId],
  );
  const statKeys = useMemo(
    () => getVisibleCharacterStatKeys(entry?.character ?? null),
    [entry],
  );

  function selectCharacter(nextId: number | null) {
    const nextEntry = owned.find((item) => item.character.id === nextId);

    setCharacterId(nextId);
    setStatInputs(buildCharacterStatsFormValues(nextEntry?.stats));
    // El personaje simulado no puede ser además su propio compañero.
    setTeammateSlots((current) =>
      current.map((slot) => (slot === String(nextId) ? '' : slot)),
    );
  }

  function changeStat(statKey: CharacterStatKey, value: string) {
    setStatInputs((current) => ({ ...current, [statKey]: value }));
  }

  function changeTeammate(slotIndex: number, value: string) {
    setTeammateSlots((current) =>
      current.map((slot, index) => (index === slotIndex ? value : slot)),
    );
  }

  /** Candidatos de un slot: el roster sin el objetivo ni los ya elegidos en otros slots. */
  function teammateOptions(slotIndex: number) {
    return owned.filter((item) => {
      const id = String(item.character.id);
      const takenElsewhere = teammateSlots.some(
        (slot, index) => index !== slotIndex && slot === id,
      );
      return item.character.id !== characterId && !takenElsewhere;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry) return;

    setIsSubmitting(true);

    try {
      const teammateCharacterIds = useCustomTeam
        ? teammateSlots.filter(Boolean).map(Number)
        : [];

      if (useCustomTeam && teammateCharacterIds.length === 0) {
        throw new Error(
          'Selecciona al menos 1 compañero para activar el equipo personalizado.',
        );
      }

      const response = await apiRequest<DamageScenarioResponse>(
        '/simulations/damage',
        {
          method: 'POST',
          token: accessToken,
          body: {
            characterId: entry.character.id,
            stats: buildStatsPayload(statKeys, statInputs),
            teammateCharacterIds: teammateCharacterIds.length
              ? teammateCharacterIds
              : undefined,
          },
        },
      );

      setResult(response);
      toast.success('Escenario hipotético simulado correctamente.');
      await onCompleted();
    } catch (err) {
      toast.error(resolveErrorMessage(err, 'No fue posible simular el escenario'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    characterId,
    entry,
    statKeys,
    statInputs,
    useCustomTeam,
    teammateSlots,
    result,
    isSubmitting,
    selectCharacter,
    changeStat,
    setUseCustomTeam,
    changeTeammate,
    teammateOptions,
    submit,
  };
}

export type DamageScenario = ReturnType<typeof useDamageScenario>;
