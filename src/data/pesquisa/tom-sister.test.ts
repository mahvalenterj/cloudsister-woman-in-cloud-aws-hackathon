import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Valida o tom da Sister contra as preocupações e as regras da spec.
const lerJson = (caminho: string) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8'));
const tom = lerJson('./tom-sister.json');
const preocupacoes = lerJson('./preocupacoes.json');
const FAIXAS = ['18-34', '35-50'];
const MOMENTOS = ['abertura', 'erro', 'fechamento'];

test('tom: origem marcada como hipótese', () => {
  assert.equal(tom.origem, 'hipotese-mock');
});

test('tom: toda preocupação tem acolhimento, e só elas', () => {
  const ids = preocupacoes.map((p: any) => p.id).sort();
  assert.deepEqual(Object.keys(tom.acolhimentoPorPreocupacao).sort(), ids);
  for (const id of ids) assert.ok(tom.acolhimentoPorPreocupacao[id].length > 0, `${id}: acolhimento vazio`);
});

test('tom: cada faixa e momento tem ponte e texto genérico', () => {
  for (const f of FAIXAS) {
    for (const m of MOMENTOS) {
      assert.ok(tom.momentos[f][m].ponte.length > 0, `${f}/${m}: sem ponte`);
      assert.ok(tom.generico[f][m].length > 0, `${f}/${m}: sem genérico`);
    }
  }
});

test('tom: faixas soam diferentes na mesma situação', () => {
  for (const m of MOMENTOS) {
    assert.notEqual(tom.momentos['18-34'][m].ponte, tom.momentos['35-50'][m].ponte, `${m}: ponte igual nas duas faixas`);
    assert.notEqual(tom.generico['18-34'][m], tom.generico['35-50'][m], `${m}: genérico igual nas duas faixas`);
  }
});

test('tom: não presume vida pessoal nem diagnostica emoção', () => {
  const textos: string[] = [
    ...Object.values<string>(tom.acolhimentoPorPreocupacao),
    ...FAIXAS.flatMap((f) => MOMENTOS.flatMap((m) => [tom.momentos[f][m].ponte, tom.generico[f][m]])),
  ];
  const proibidas = /filh|marid|casad|solteir|esposa|você está (com )?(ansios|triste|deprimid|com medo|insegur)/i;
  for (const t of textos) assert.ok(!proibidas.test(t), `texto proibido: "${t}"`);
});
