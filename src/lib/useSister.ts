import { useUsuariaAtual } from '@/store/useAuthStore';
import { useJornadaStore } from '@/store/useJornadaStore';
import type { MomentoSister } from '@/types/sister';

import { FAIXA_PADRAO, faixaPorIdade } from './faixa';
import { sister } from './sisterApp';

// Liga a Sister ao estado da usuária: a idade define a faixa (tom) e o check-in define a preocupação.
export function useSister(pilulaId: string) {
  const usuaria = useUsuariaAtual();
  const preocupacaoId = useJornadaStore((s) => s.preocupacaoId);
  // Convidada não informa idade e usa a faixa de entrada.
  const faixa = usuaria ? faixaPorIdade(usuaria.idade) : FAIXA_PADRAO;

  const falar = (momento: MomentoSister) =>
    sister({ faixa, preocupacaoId: preocupacaoId ?? undefined, pilulaId, momento });

  return {
    faixa,
    preocupacaoId,
    falar,
    // Props prontas para <SisterBalao {...balao('abertura')} />.
    balao: (momento: MomentoSister) => {
      const { mensagem, fontes } = falar(momento);
      return { mensagem, fontes };
    },
  };
}
