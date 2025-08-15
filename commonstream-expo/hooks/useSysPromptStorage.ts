// src/hooks/useSysPromptStorage.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  SysPromptObject,
  SysPromptProfile,
} from '@/data/SysPromptStorage';
import {
  getSysPromptProfile,
  addSysPrompt,
  updateSysPrompt,
  toggleSysPrompt,
  removeSysPrompt,
  reorderSysPrompts,
  clearSysPrompts,
  getEnabledSysPromptTexts,
  subscribeSysPrompts,
} from '@/data/SysPromptStorage';

type AddInput = {
  title: string;
  content: string;
  enabled?: boolean;
  tags?: string[];
};

type UpdatePatch = Partial<
  Omit<SysPromptObject, 'id' | 'createdAt' | 'order'>
>;

type Options = {
  /** Auto-load on mount (default true) */
  autoLoad?: boolean;
};

const EMPTY_PROFILE: SysPromptProfile = { version: 1, items: [] };

export default function useSysPromptStorage(options: Options = {}) {
  const { autoLoad = true } = options;

  const [profile, setProfile] = useState<SysPromptProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState<boolean>(!!autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getSysPromptProfile();
      setProfile(p);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load system prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + live subscription to storage changes
  useEffect(() => {
    let mounted = true;
    if (autoLoad) refresh();
    const unsub = subscribeSysPrompts((p) => {
      if (mounted) setProfile(p);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [autoLoad, refresh]);

  /** Sorted items for UI */
  const items = useMemo(
    () => profile.items.slice().sort((a, b) => a.order - b.order),
    [profile.items]
  );

  /** Convenience: enabled prompt texts in order */
  const enabledTexts = useMemo(
    () => items.filter((i) => i.enabled).map((i) => i.content),
    [items]
  );

  // ---- Mutations (lightweight refresh after each) ----
  const addPrompt = useCallback(async (input: AddInput) => {
    await addSysPrompt(input);
    const p = await getSysPromptProfile();
    setProfile(p);
  }, []);

  const updatePrompt = useCallback(
    async (id: string, patch: UpdatePatch) => {
      await updateSysPrompt(id, patch);
      const p = await getSysPromptProfile();
      setProfile(p);
    },
    []
  );

  const togglePrompt = useCallback(async (id: string, enabled: boolean) => {
    await toggleSysPrompt(id, enabled);
    const p = await getSysPromptProfile();
    setProfile(p);
  }, []);

  const removePrompt = useCallback(async (id: string) => {
    await removeSysPrompt(id);
    const p = await getSysPromptProfile();
    setProfile(p);
  }, []);

  const reorderPrompts = useCallback(async (idsInOrder: string[]) => {
    await reorderSysPrompts(idsInOrder);
    const p = await getSysPromptProfile();
    setProfile(p);
  }, []);

  const clearAll = useCallback(async () => {
    await clearSysPrompts();
    const p = await getSysPromptProfile();
    setProfile(p);
  }, []);

  /** Build the system array fresh from storage (useful right before a request). */
  const buildForLLM = useCallback(async (): Promise<string[]> => {
    return getEnabledSysPromptTexts();
  }, []);

  return {
    // state
    profile,
    items,
    enabledTexts,
    loading,
    error,

    // actions
    refresh,
    addPrompt,
    updatePrompt,
    togglePrompt,
    removePrompt,
    reorderPrompts,
    clearAll,

    // helpers
    buildForLLM,
  };
}
