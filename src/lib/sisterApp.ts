import corpusJson from '@/data/rag/corpus-aws.json';
import preocupacoesJson from '@/data/pesquisa/preocupacoes.json';
import tomJson from '@/data/pesquisa/tom-sister.json';
import type { DadosSister } from '@/types/sister';

import { criarSister } from './sister';

// Liga os JSON do app ao núcleo puro. O corpus vem do AWS Knowledge MCP, mas só em build: nada de MCP em runtime.
export const sister = criarSister({
  corpus: corpusJson,
  preocupacoes: preocupacoesJson,
  tom: tomJson,
} as unknown as DadosSister);

export const PREOCUPACOES = preocupacoesJson as unknown as DadosSister['preocupacoes'];
