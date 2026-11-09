import { useSyncExternalStore } from 'react';

import { useAuthStore } from './useAuthStore';

const assinar = (aviso: () => void) => useAuthStore.persist.onFinishHydration(aviso);
const lerHidratado = () => useAuthStore.persist.hasHydrated();

// Aguarda o AsyncStorage terminar de reidratar o store antes de renderizar rotas.
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(assinar, lerHidratado, lerHidratado);
}
