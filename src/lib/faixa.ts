import type { FaixaEtaria } from '../types/sister';

// Idade define o tom da Sister (o perfil início/transição define o foco).
// Corte 18–34 / 35–50, sem sobreposição. Fora do intervalo, usa a faixa mais próxima.
export const IDADE_CORTE_FAIXA = 35;

export function faixaPorIdade(idade: number): FaixaEtaria {
  return idade >= IDADE_CORTE_FAIXA ? '35-50' : '18-34';
}

// Convidada não informa idade: começa pela faixa de entrada.
export const FAIXA_PADRAO: FaixaEtaria = '18-34';
