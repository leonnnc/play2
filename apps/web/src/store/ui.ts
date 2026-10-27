import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface UIState {
  toasts: Toast[];
  toast: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
  searchFocus: number;
  focusSearch: () => void;
}

let seq = 0;

export const useUI = create<UIState>((set, get) => ({
  toasts: [],
  toast: (message, kind = 'info') => {
    const id = ++seq;
    set({ toasts: [...get().toasts, { id, message, kind }] });
    window.setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  searchFocus: 0,
  focusSearch: () => set({ searchFocus: Date.now() }),
}));
