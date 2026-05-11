import { create } from 'zustand';
import { usersApi } from '../api/users.api';
import { queryClient } from '../lib/query-client';

interface FavoritesState {
  ids: Set<string>;
  isLoading: boolean;
  initialize: () => Promise<void>;
  addFavorite: (facilityId: string) => Promise<void>;
  removeFavorite: (facilityId: string) => Promise<void>;
  toggle: (facilityId: string) => Promise<void>;
  isFavorite: (facilityId: string) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set<string>(),
  isLoading: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const res = await usersApi.getFavorites();
      // TransformInterceptor wraps: { success, data: [...], timestamp }
      const list: any[] = res.data.data ?? [];
      const ids = new Set<string>(list.map((f: any) => String(f._id)));
      set({ ids, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addFavorite: async (facilityId: string) => {
    const { ids } = get();
    const next = new Set(ids);
    next.add(facilityId);
    set({ ids: next });
    try {
      await usersApi.addFavorite(facilityId);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      set({ ids }); // rollback
    }
  },

  removeFavorite: async (facilityId: string) => {
    const { ids } = get();
    const next = new Set(ids);
    next.delete(facilityId);
    set({ ids: next });
    try {
      await usersApi.removeFavorite(facilityId);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      set({ ids }); // rollback
    }
  },

  toggle: async (facilityId: string) => {
    const { ids, addFavorite, removeFavorite } = get();
    if (ids.has(facilityId)) {
      await removeFavorite(facilityId);
    } else {
      await addFavorite(facilityId);
    }
  },

  isFavorite: (facilityId: string) => get().ids.has(facilityId),

  reset: () => set({ ids: new Set<string>(), isLoading: false }),
}));
