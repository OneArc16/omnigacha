import {
  getRarityBarClassName,
  isFiveStar,
} from '../../../components/characters/rarity-style';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { ButtonLink } from '../../../components/ui/button-link';
import { HeroStat } from '../../../components/ui/hero-stat';
import { Note } from '../../../components/ui/note';
import { WindowPanel } from '../../../components/ui/window-panel';
import type { UserCharacter } from '../../../lib/api';

const EMPTY_SEGMENT_CLASSNAME = getRarityBarClassName(0);

function RarityBar({ fiveStar, fourStar }: { fiveStar: number; fourStar: number }) {
  const segments = [
    ...Array<string>(fiveStar).fill(getRarityBarClassName(5)),
    ...Array<string>(fourStar).fill(getRarityBarClassName(4)),
  ];

  return (
    <>
      <div className="mt-3.5 flex gap-[3px]">
        {(segments.length > 0 ? segments : [EMPTY_SEGMENT_CLASSNAME]).map(
          (segmentClassName, index) => (
            <i key={index} className={`h-1.5 flex-1 ${segmentClassName}`} />
          ),
        )}
      </div>
      <div className="mt-2 flex gap-4 text-[11px] text-muted">
        <span>
          <b className="mr-1.5 inline-block size-2 rotate-45 bg-gold" />
          5★ · {fiveStar}
        </span>
        <span>
          <b className="mr-1.5 inline-block size-2 rotate-45 bg-accent-purple-deep" />
          4★ · {fourStar}
        </span>
      </div>
    </>
  );
}

type ControlPanelProps = {
  characters: UserCharacter[];
  error: string;
  onManageRoster: () => void;
};

export function ControlPanel({
  characters,
  error,
  onManageRoster,
}: ControlPanelProps) {
  const total = characters.length;
  const fiveStar = characters.filter((entry) =>
    isFiveStar(entry.character.rarity),
  ).length;

  return (
    <WindowPanel
      title="Panel de control"
      subtitle="Tu resumen rápido para decidir el siguiente movimiento."
    >
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <HeroStat
        eyebrow="Estado del roster"
        value={total}
        unit={total === 1 ? 'personaje' : 'personajes'}
        caption="listos para análisis y simulación."
      >
        <RarityBar fiveStar={fiveStar} fourStar={total - fiveStar} />
      </HeroStat>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <ButtonLink href="/simulator" className="w-full px-3 py-3">
          Ir al simulador
        </ButtonLink>
        <Button variant="ghost" className="w-full px-3 py-3" onClick={onManageRoster}>
          Gestionar roster
        </Button>
      </div>

      <Note className="mt-3.5">
        El tablero y el roster están separados por ventanas: abre solo el
        contexto que necesitas.
      </Note>
    </WindowPanel>
  );
}
