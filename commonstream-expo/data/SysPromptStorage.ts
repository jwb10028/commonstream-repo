// src/data/SysPromptStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Single system prompt that can be sent to the LLM */
export type SysPromptObject = {
  id: string;
  /** Short label to recognize this prompt in UI */
  title: string;
  /** The actual system prompt text sent to the LLM */
  content: string;
  /** If false, omit from requests */
  enabled: boolean;
  /** Optional category/tags for filtering */
  tags?: string[];
  /** Stable ordering for the UI */
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type SysPromptProfile = {
  version: number;
  items: SysPromptObject[];
};

const STORAGE_KEY = 'sys_prompt_profile_v1';

const now = () => Date.now();
const genId = () =>
  `${Math.random().toString(36).slice(2, 8)}${now().toString(36)}`;

/** --- Persistence primitives --- */
async function readProfile(): Promise<SysPromptProfile> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const empty: SysPromptProfile = { version: 1, items: [] };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }
  try {
    const parsed = JSON.parse(raw) as SysPromptProfile;
    // defensive defaults
    return {
      version: parsed.version ?? 1,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    // corrupted? reset
    const reset: SysPromptProfile = { version: 1, items: [] };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    return reset;
  }
}

async function writeProfile(profile: SysPromptProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** --- Public API --- */

/** Get the full profile (all prompts). */
export async function getSysPromptProfile(): Promise<SysPromptProfile> {
  return readProfile();
}

/** Replace the profile wholesale (rare). */
export async function setSysPromptProfile(
  profile: SysPromptProfile
): Promise<void> {
  await writeProfile(profile);
  notify(profile);
}

/** Add a new prompt (enabled by default, appended to end). */
export async function addSysPrompt(input: {
  title: string;
  content: string;
  enabled?: boolean;
  tags?: string[];
}): Promise<SysPromptObject> {
  const profile = await readProfile();
  const maxOrder =
    profile.items.length === 0
      ? 0
      : Math.max(...profile.items.map((i) => i.order));
  const item: SysPromptObject = {
    id: genId(),
    title: input.title.trim(),
    content: input.content,
    enabled: input.enabled ?? true,
    tags: input.tags,
    order: maxOrder + 1,
    createdAt: now(),
    updatedAt: now(),
  };
  const next: SysPromptProfile = {
    ...profile,
    items: [...profile.items, item],
  };
  await writeProfile(next);
  notify(next);
  return item;
}

/** Update fields on an existing prompt. */
export async function updateSysPrompt(
  id: string,
  patch: Partial<Omit<SysPromptObject, 'id' | 'createdAt' | 'order'>>
): Promise<SysPromptObject | null> {
  const profile = await readProfile();
  const idx = profile.items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const current = profile.items[idx];
  const updated: SysPromptObject = {
    ...current,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : current.title,
    updatedAt: now(),
  };
  const next: SysPromptProfile = {
    ...profile,
    items: [
      ...profile.items.slice(0, idx),
      updated,
      ...profile.items.slice(idx + 1),
    ],
  };
  await writeProfile(next);
  notify(next);
  return updated;
}

/** Enable/disable a prompt quickly. */
export async function toggleSysPrompt(
  id: string,
  enabled: boolean
): Promise<void> {
  await updateSysPrompt(id, { enabled });
}

/** Remove a prompt by id. */
export async function removeSysPrompt(id: string): Promise<void> {
  const profile = await readProfile();
  const next: SysPromptProfile = {
    ...profile,
    items: profile.items.filter((i) => i.id !== id),
  };
  await writeProfile(next);
  notify(next);
}

/**
 * Reorder prompts by supplying the ids in the desired order.
 * Any ids not present will be appended, preserving their relative order.
 */
export async function reorderSysPrompts(idsInOrder: string[]): Promise<void> {
  const profile = await readProfile();
  const map = new Map(profile.items.map((i) => [i.id, i]));
  const ordered: SysPromptObject[] = [];
  idsInOrder.forEach((id) => {
    const item = map.get(id);
    if (item) ordered.push(item);
  });
  // append any leftovers
  profile.items.forEach((i) => {
    if (!idsInOrder.includes(i.id)) ordered.push(i);
  });
  const next = ordered.map((i, idx) => ({ ...i, order: idx + 1 }));
  const finalProfile: SysPromptProfile = { ...profile, items: next };
  await writeProfile(finalProfile);
  notify(finalProfile);
}

/** Clear all prompts. */
export async function clearSysPrompts(): Promise<void> {
  const empty: SysPromptProfile = { version: 1, items: [] };
  await writeProfile(empty);
  notify(empty);
}

/** Convenience: fetch only enabled prompt texts (in order). */
export async function getEnabledSysPromptTexts(): Promise<string[]> {
  const { items } = await readProfile();
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((i) => i.enabled)
    .map((i) => i.content);
}

/** --- Tiny subscription (for future hooks/UI) --- */
type Listener = (profile: SysPromptProfile) => void;
const listeners = new Set<Listener>();
function notify(profile: SysPromptProfile) {
  listeners.forEach((fn) => fn(profile));
}

/** Subscribe to changes; returns unsubscribe. */
export function subscribeSysPrompts(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
