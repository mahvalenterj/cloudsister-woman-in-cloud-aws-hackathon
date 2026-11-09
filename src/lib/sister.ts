import type { DadosSister, EntradaSister, SaidaSister } from '../types/sister';

// Núcleo puro da Sister: sem Expo, sem React e sem importar JSON, para rodar direto no Node.
// Os dados entram por parâmetro; `sisterApp.ts` liga os JSON do app.
// A recuperação é um mock determinístico (tags + pontuação) com o mesmo contrato de um RAG real.

export function criarSister(dados: DadosSister) {
  return function sister(entrada: EntradaSister): SaidaSister {
    const { faixa, pilulaId, momento } = entrada;
    const { corpus, preocupacoes, tom } = dados;

    // Preocupação de outra faixa ou desconhecida é ignorada, em vez de falar no tom errado.
    const preocupacao = preocupacoes.find((p) => p.id === entrada.preocupacaoId && p.faixa === faixa);
    const tagsDela = new Set(preocupacao?.tags ?? []);

    // Só chunks ligados à pílula; o de maior pontuação vence, e o empate fica com o primeiro do corpus.
    let melhor: { chunk: (typeof corpus)[number]; pontos: number } | undefined;
    for (const chunk of corpus) {
      if (!chunk.pilulaIds.includes(pilulaId)) continue;
      const pontos = chunk.tags.filter((t) => tagsDela.has(t)).length;
      if (!melhor || pontos > melhor.pontos) melhor = { chunk, pontos };
    }

    // Sem chunk relevante: acolhimento genérico, sem inventar conteúdo técnico.
    if (!melhor) {
      return { mensagem: tom.generico[faixa][momento], chunkIds: [], fontes: [] };
    }

    const { chunk } = melhor;
    const acolhimento = momento === 'abertura' && preocupacao ? tom.acolhimentoPorPreocupacao[preocupacao.id] : undefined;
    const partes = [
      acolhimento,
      tom.momentos[faixa][momento].ponte,
      chunk.texto,
      `(Fonte: ${chunk.fonte.titulo})`,
    ].filter((p): p is string => Boolean(p));

    return { mensagem: partes.join(' '), chunkIds: [chunk.id], fontes: [chunk.fonte] };
  };
}
