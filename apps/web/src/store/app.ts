import { create } from 'zustand';
import { api } from '../lib/api';
import { CATEGORY_FALLBACK } from '../lib/categories';
import type { Category, ProviderStatus } from '../lib/types';

interface AppState {
  version: string;
  online: boolean;
  providers: ProviderStatus[];
  categories: Category[];
  bootstrapped: boolean;
  bootstrap: () => Promise<void>;
}

export const useApp = create<AppState>((set, get) => ({
  version: '0.1.0',
  online: false,
  providers: [],
  categories: CATEGORY_FALLBACK,
  bootstrapped: false,

  bootstrap: async () => {
    if (get().bootstrapped) return;
    set({ bootstrapped: true });
    try {
      const [health, cats] = await Promise.all([api.health(), api.categories()]);
      set({
        version: health.version,
        online: true,
        providers: health.providers,
        categories: cats.categories.length ? cats.categories : CATEGORY_FALLBACK,
      });
    } catch {
      set({ online: false });
    }
  },
}));
