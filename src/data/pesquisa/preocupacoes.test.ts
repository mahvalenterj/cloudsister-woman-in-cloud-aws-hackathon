import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Valida o schema das preocupações (docs/SPEC-SISTER.md, seção Contratos).
const lerJson = (caminho: string) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8'));
const preocupacoes = lerJson('./preocupacoes.json');
const corpus = lerJson('../rag/corpus-aws.json');
const FAIXAS = ['18-34', '35-50'];
const tagsDoCorpus = new Set<string>(corpus.flatMap((c: any) => c.tags));

test('preocupações: schema e origem', () => {
  const ids = new Set<string>();
  for (const p of preocupacoes) {
    assert.ok(!ids.has(p.id), `id repetido: ${p.id}`);
    ids.add(p.id);
    assert.ok(FAIXAS.includes(p.faixa), `${p.id}: faixa inválida ${p.faixa}`);
    assert.ok(p.rotulo.length > 0, `${p.id}: sem rótulo`);
    assert.ok(p.tags.length > 0, `${p.id}: sem tags`);
    // Enquanto a pesquisa real não chega, todo item é hipótese.
    assert.equal(p.origem, 'hipotese-mock', `${p.id}: origem inesperada`);
  }
});

test('preocupações: as duas faixas têm opções para o check-in', () => {
  for (const f of FAIXAS) {
    const n = preocupacoes.filter((p: any) => p.faixa === f).length;
    assert.ok(n >= 3, `faixa ${f} tem só ${n} preocupações`);
  }
});

test('preocupações: toda tag existe no corpus (senão não pontua nenhum chunk)', () => {
  for (const p of preocupacoes) {
    for (const t of p.tags) assert.ok(tagsDoCorpus.has(t), `${p.id}: tag "${t}" não existe no corpus`);
  }
});

test('preocupações: não presumem vida pessoal', () => {
  const proibidas = /filh|marid|casad|solteir|mãe|mae\b|esposa/i;
  for (const p of preocupacoes) assert.ok(!proibidas.test(p.rotulo), `${p.id}: rótulo presume vida pessoal`);
});
