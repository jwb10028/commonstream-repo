// src/hooks/useTasteStorage.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTasteProfile,
  subscribeTasteProfile,
  addTaste as addTasteDL,
  updateTaste as updateTasteDL,
  removeTaste as removeTasteDL,
  setTastes as setTastesDL,
  exportTasteProfile as exportTasteDL,
  importTasteProfile as importTasteDL,
  clearTasteProfile as clearDL,
  type TasteProfile,
  type TasteObject,
  type TasteKind,
  type NewTasteInput,
} from '@/data/TasteStorage';

export interface UseTasteStorageValue {
  profile: TasteProfile;
  loading: boolean;

  // CRUD
  addTaste: (input: NewTasteInput) => Promise<TasteObject>;
  updateTaste: (id: string, patch: Partial<Omit<TasteObject, 'id' | 'createdAt'>>) => Promise<TasteObject | null>;
  removeTaste: (id: string) => Promise<boolean>;
  setTastes: (items: TasteObject[] | ((prev: TasteObject[]) => TasteObject[])) => Promise<void>;

  // Utilities
  clear: () => Promise<void>;
  exportProfile: () => Promise<string>;
  importProfile: (json: string, strategy?: 'replace' | 'merge') => Promise<void>;
  refresh: () => Promise<void>;

  // Selectors (sync, derived from current profile state)
  getByKind: (kind: TasteKind) => TasteObject[];
  search: (q: string) => TasteObject[];
  countByKind: () => Record<TasteKind, number>;
}

export function useTasteStorage(): UseTasteStorageValue {
  const [profile, setProfile] = useState<TasteProfile>({ version: 1, items: [] });
  const [loading, setLoading] = useState(true);

  // initial load + live subscription
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      const p = await getTasteProfile();
      if (!mounted) return;
      setProfile(p);
      setLoading(false);
      unsub = subscribeTasteProfile(setProfile);
    })();

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  // ----- CRUD (delegate to data layer) -----
  const addTaste = useCallback((input: NewTasteInput) => addTasteDL(input), []);
  const updateTaste = useCallback(
    (id: string, patch: Partial<Omit<TasteObject, 'id' | 'createdAt'>>) => updateTasteDL(id, patch),
    []
  );
  const removeTaste = useCallback((id: string) => removeTasteDL(id), []);
  const setTastes = useCallback(
    (items: TasteObject[] | ((prev: TasteObject[]) => TasteObject[])) => setTastesDL(items),
    []
  );

  // ----- Utilities -----
  const clear = useCallback(() => clearDL(), []);
  const exportProfile = useCallback(() => exportTasteDL(), []);
  const importProfile = useCallback((json: string, strategy: 'replace' | 'merge' = 'replace') => importTasteDL(json, strategy), []);
  const refresh = useCallback(async () => {
    const p = await getTasteProfile(); // comes from cache/disk in data layer
    setProfile(p);
  }, []);

  // ----- Selectors (derived from local state) -----
  const getByKind = useCallback(
    (kind: TasteKind) => profile.items.filter((it) => it.kind === kind),
    [profile.items]
  );

  const search = useCallback(
    (q: string) => {
      const s = q.trim().toLowerCase();
      if (!s) return profile.items;
      return profile.items.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          it.tags?.some((t) => t.toLowerCase().includes(s)) ||
          it.note?.toLowerCase().includes(s)
      );
    },
    [profile.items]
  );

  const countByKind = useCallback(() => {
    const counts = {} as Record<TasteKind, number>;
    for (const it of profile.items) {
      counts[it.kind] = (counts[it.kind] ?? 0) + 1;
    }
    return counts;
  }, [profile.items]);

  // Stable object identity
  return useMemo(
    () => ({
      profile,
      loading,
      addTaste,
      updateTaste,
      removeTaste,
      setTastes,
      clear,
      exportProfile,
      importProfile,
      refresh,
      getByKind,
      search,
      countByKind,
    }),
    [profile, loading, addTaste, updateTaste, removeTaste, setTastes, clear, exportProfile, importProfile, refresh, getByKind, search, countByKind]
  );
}
