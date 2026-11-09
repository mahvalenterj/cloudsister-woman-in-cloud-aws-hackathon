import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ResultadoRecomendacao, TrilhaId } from '@/lib/recommendation';

interface JornadaState {
  trilhaAtiva: TrilhaId | null;
  trilhaConfirmada: boolean;
  resultado: ResultadoRecomendacao | null;
  // Resposta do check-in "o que pesa hoje?" (null = pulou ou ainda não respondeu).
  preocupacaoId: string | null;

  definirPreocupacao: (id: string | null) => void;
  definirResultado: (r: ResultadoRecomendacao) => void;
  escolherTrilha: (id: TrilhaId) => void;
  confirmarTrilha: () => void;
}

export const useJornadaStore = create<JornadaState>()(
  persist(
    (set) => ({
      trilhaAtiva: null,
      trilhaConfirmada: false,
      resultado: null,
      preocupacaoId: null,

      definirPreocupacao: (id) => set({ preocupacaoId: id }),
      definirResultado: (r) =>
        set({ resultado: r, trilhaAtiva: r.trilhaRecomendada, trilhaConfirmada: false }),
      // Escolha direta ("já sei o que quero") não tem resultado de questionário.
      escolherTrilha: (id) => set({ trilhaAtiva: id, trilhaConfirmada: false }),
      confirmarTrilha: () => set({ trilhaConfirmada: true }),
    }),
    {
      name: 'cloudsister-jornada',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
