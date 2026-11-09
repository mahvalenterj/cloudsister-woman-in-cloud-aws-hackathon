import assert from 'node:assert/strict';
import { test } from 'node:test';

import { faixaPorIdade } from './faixa.ts';

test('corte 18–34 / 35–50: 34 e 35 caem em faixas diferentes', () => {
  assert.equal(faixaPorIdade(34), '18-34');
  assert.equal(faixaPorIdade(35), '35-50');
});

test('usuárias seed: 22 e 27 na primeira faixa, Carla (35) na segunda', () => {
  assert.equal(faixaPorIdade(22), '18-34');
  assert.equal(faixaPorIdade(27), '18-34');
  assert.equal(faixaPorIdade(35), '35-50');
});

test('fora de 18–50 usa a faixa mais próxima', () => {
  assert.equal(faixaPorIdade(16), '18-34');
  assert.equal(faixaPorIdade(18), '18-34');
  assert.equal(faixaPorIdade(50), '35-50');
  assert.equal(faixaPorIdade(63), '35-50');
});
