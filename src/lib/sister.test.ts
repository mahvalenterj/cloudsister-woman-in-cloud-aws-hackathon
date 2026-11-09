import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { criarSister } from './sister.ts';

const lerJson = (caminho: string) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8'));
const dados = {
  corpus: lerJson('../data/rag/corpus-aws.json'),
  preocupacoes: lerJson('../data/pesquisa/preocupacoes.json'),
  tom: lerJson('../data/pesquisa/tom-sister.json'),
};
const sister = criarSister(dados);

test('18 e 38 anos na mesma pílula recebem mensagens diferentes', () => {
  const a = sister({ faixa: '18-34', preocupacaoId: 'jovem-nao-sou-boa', pilulaId: 'ca-01', momento: 'abertura' });
  const b = sister({ faixa: '35-50', preocupacaoId: 'madura-recomeco', pilulaId: 'ca-01', momento: 'abertura' });
  assert.notEqual(a.mensagem, b.mensagem);
});

test('trocar a preocupação muda a mensagem', () => {
  const a = sister({ faixa: '18-34', preocupacaoId: 'jovem-nao-sou-boa', pilulaId: 'ca-01', momento: 'abertura' });
  const b = sister({ faixa: '18-34', preocupacaoId: 'jovem-siglas', pilulaId: 'ca-01', momento: 'abertura' });
  assert.notEqual(a.mensagem, b.mensagem);
});

test('a preocupação escolhe o chunk pelas tags (siglas -> IaaS/PaaS/SaaS)', () => {
  const r = sister({ faixa: '18-34', preocupacaoId: 'jovem-siglas', pilulaId: 'ca-01', momento: 'abertura' });
  assert.deepEqual(r.chunkIds, ['aws-modelos-iaas-paas-saas']);
});

test('toda mensagem técnica cita a fonte AWS', () => {
  for (const pilulaId of ['ca-01', 'cs-01']) {
    for (const momento of ['abertura', 'erro', 'fechamento'] as const) {
      const r = sister({ faixa: '35-50', preocupacaoId: 'madura-recomeco', pilulaId, momento });
      assert.equal(r.chunkIds.length, 1);
      assert.equal(r.fontes.length, 1);
      assert.ok(r.fontes[0].url.startsWith('https://'));
      assert.ok(r.mensagem.includes(`(Fonte: ${r.fontes[0].titulo})`), `${pilulaId}/${momento}: sem fonte na mensagem`);
    }
  }
});

test('a mensagem só usa texto dos chunks (não inventa conteúdo)', () => {
  const r = sister({ faixa: '18-34', preocupacaoId: 'jovem-medo-de-errar', pilulaId: 'cs-01', momento: 'erro' });
  const chunk = dados.corpus.find((c: any) => c.id === r.chunkIds[0]);
  assert.ok(r.mensagem.includes(chunk.texto));
});

test('pílula sem chunk usa o acolhimento genérico, sem fonte', () => {
  const r = sister({ faixa: '35-50', preocupacaoId: 'madura-recomeco', pilulaId: 'xx-99', momento: 'erro' });
  assert.equal(r.mensagem, dados.tom.generico['35-50'].erro);
  assert.deepEqual(r.chunkIds, []);
  assert.deepEqual(r.fontes, []);
});

test('sem check-in ou com preocupação de outra faixa: ainda responde, sem acolhimento específico', () => {
  const sem = sister({ faixa: '18-34', pilulaId: 'ca-01', momento: 'abertura' });
  const outraFaixa = sister({ faixa: '18-34', preocupacaoId: 'madura-recomeco', pilulaId: 'ca-01', momento: 'abertura' });
  assert.equal(sem.mensagem, outraFaixa.mensagem);
  assert.equal(sem.chunkIds.length, 1);
  assert.ok(!sem.mensagem.includes(dados.tom.acolhimentoPorPreocupacao['madura-recomeco']));
});

test('acolhimento da preocupação só aparece na abertura', () => {
  const acolhimento = dados.tom.acolhimentoPorPreocupacao['jovem-siglas'];
  const abertura = sister({ faixa: '18-34', preocupacaoId: 'jovem-siglas', pilulaId: 'ca-01', momento: 'abertura' });
  const erro = sister({ faixa: '18-34', preocupacaoId: 'jovem-siglas', pilulaId: 'ca-01', momento: 'erro' });
  assert.ok(abertura.mensagem.startsWith(acolhimento));
  assert.ok(!erro.mensagem.includes(acolhimento));
});

test('determinística: mesma entrada, mesma saída', () => {
  const e = { faixa: '35-50', preocupacaoId: 'madura-pouco-tempo', pilulaId: 'cs-01', momento: 'fechamento' } as const;
  assert.deepEqual(sister(e), sister(e));
});
