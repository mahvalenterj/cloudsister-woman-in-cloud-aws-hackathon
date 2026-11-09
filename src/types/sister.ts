// Contratos da Sister (docs/SPEC-SISTER.md).

export type FaixaEtaria = '18-34' | '35-50';
export type MomentoSister = 'abertura' | 'erro' | 'fechamento';

export interface FonteAws {
  titulo: string;
  url: string;
}

export interface Preocupacao {
  id: string;
  faixa: FaixaEtaria;
  rotulo: string;
  tags: string[];
  /** 'hipotese-mock' enquanto a pesquisa real não chega. */
  origem: string;
}

export interface ChunkCorpus {
  id: string;
  fonte: FonteAws;
  tags: string[];
  texto: string;
  pilulaIds: string[];
}

export interface TomSister {
  origem: string;
  acolhimentoPorPreocupacao: Record<string, string>;
  momentos: Record<FaixaEtaria, Record<MomentoSister, { ponte: string }>>;
  generico: Record<FaixaEtaria, Record<MomentoSister, string>>;
}

export interface DadosSister {
  corpus: ChunkCorpus[];
  preocupacoes: Preocupacao[];
  tom: TomSister;
}

export interface EntradaSister {
  faixa: FaixaEtaria;
  preocupacaoId?: string;
  pilulaId: string;
  momento: MomentoSister;
}

export interface SaidaSister {
  mensagem: string;
  chunkIds: string[];
  fontes: FonteAws[];
}
