import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Valida o schema do corpus da Sister (docs/SPEC-SISTER.md, seção Contratos).
const corpus = JSON.parse(readFileSync(new URL('./corpus-aws.json', import.meta.url), 'utf8'));
const trilhas = ['cloud-architect', 'cloud-security'].map((n) =>
  JSON.parse(readFileSync(new URL(`../trilhas/${n}.json`, import.meta.url), 'utf8')),
);
const pilulasExistentes = new Set<string>(trilhas.flatMap((t) => t.pilulas.map((p: any) => p.id)));
const PILULAS_COM_TAGS = [...pilulasExistentes];

test('corpus: schema dos chunks', () => {
  const ids = new Set<string>();
  for (const c of corpus) {
    assert.ok(!ids.has(c.id), `id repetido: ${c.id}`);
    ids.add(c.id);
    assert.ok(c.texto.length > 0, `${c.id}: texto vazio`);
    assert.ok(c.tags.length > 0, `${c.id}: sem tags`);
    assert.ok(c.pilulaIds.length > 0, `${c.id}: sem pílula`);
    for (const p of c.pilulaIds) assert.ok(pilulasExistentes.has(p), `${c.id}: pílula inexistente ${p}`);
  }
});

test('corpus: toda fonte é uma URL da AWS (a Sister cita a fonte)', () => {
  for (const c of corpus) {
    assert.ok(c.fonte.titulo, `${c.id}: fonte sem título`);
    const url = new URL(c.fonte.url);
    assert.equal(url.protocol, 'https:');
    const daAws = url.hostname.endsWith('aws.amazon.com') || url.hostname === 'repost.aws';
    assert.ok(daAws, `${c.id}: fonte fora da AWS (${url.hostname})`);
  }
});

test('corpus: toda pílula das trilhas tem pelo menos 3 chunks', () => {
  for (const id of pilulasExistentes) {
    const n = corpus.filter((c: any) => c.pilulaIds.includes(id)).length;
    assert.ok(n >= 3, `${id} tem só ${n} chunks`);
  }
});

test('corpus: cada pílula tem chunks que combinam com as duas faixas de preocupações', () => {
  // Sem tag em comum a pontuação empata em zero e a escolha da preocupação não faria diferença.
  const preocupacoes = JSON.parse(readFileSync(new URL('../pesquisa/preocupacoes.json', import.meta.url), 'utf8'));
  for (const id of PILULAS_COM_TAGS) {
    for (const faixa of ['18-34', '35-50']) {
      const tags = new Set<string>(preocupacoes.filter((p: any) => p.faixa === faixa).flatMap((p: any) => p.tags));
      const casa = corpus.some((c: any) => c.pilulaIds.includes(id) && c.tags.some((t: string) => tags.has(t)));
      assert.ok(casa, `${id}/${faixa}: nenhum chunk casa com as tags das preocupações`);
    }
  }
});
