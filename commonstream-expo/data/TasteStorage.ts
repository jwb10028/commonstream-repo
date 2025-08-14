// src/data/TasteStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key (bump suffix for breaking changes) */
export const TASTE_STORAGE_KEY = '@taste_profile_v1';

export type TasteKind =
  | 'music' | 'artist' | 'album' | 'playlist'
  | 'movie' | 'tv' | 'game' | 'book'
  | 'podcast' | 'other';

export interface TasteObject {
  id: string;                       // stable id
  kind: TasteKind;                  // what this is
  name: string;                     // label
  tags?: string[];                  // user tags
  rating?: number;                  // 0..10 (optional)
  favorite?: boolean;               // quick star
  note?: string;                    // free text
  imageUrl?: string;                // local file:// or remote preview
  externalId?: string;              // provider id (e.g., spotify), optional
  metadata?: Record<string, any>;   // extra fields (year, genre, etc.)
  createdAt: string;                // ISO
  updatedAt: string;                // ISO
}

export interface TasteProfile {
  version: number;
  items: TasteObject[];
}

/* ---------------- In-memory cache + listeners ---------------- */

let _cache: TasteProfile | null = null;
const _listeners = new Set<(p: TasteProfile) => void>();

function nowISO() { return new Date().toISOString(); }
function rid() { return Math.random().toString(36).slice(2) + '-' + Date.now().toString(36); }

function sanitize(raw: any): TasteProfile {
  const safe: TasteProfile = {
    version: Number(raw?.version ?? 1),
    items: Array.isArray(raw?.items) ? raw.items : [],
  };
  // guard/normalize each item
  safe.items = safe.items.map((it: any) => ({
    id: String(it?.id ?? rid()),
    kind: (it?.kind as TasteKind) ?? 'other',
    name: String(it?.name ?? 'Untitled'),
    tags: Array.isArray(it?.tags) ? it.tags.map(String) : [],
    rating: typeof it?.rating === 'number' ? it.rating : undefined,
    favorite: Boolean(it?.favorite),
    note: typeof it?.note === 'string' ? it.note : undefined,
    imageUrl: typeof it?.imageUrl === 'string' ? it.imageUrl : undefined,
    externalId: typeof it?.externalId === 'string' ? it.externalId : undefined,
    metadata: typeof it?.metadata === 'object' && it?.metadata ? it.metadata : {},
    createdAt: typeof it?.createdAt === 'string' ? it.createdAt : nowISO(),
    updatedAt: typeof it?.updatedAt === 'string' ? it.updatedAt : nowISO(),
  }));
  return safe;
}

async function _loadFromDisk(): Promise<TasteProfile> {
  try {
    const raw = await AsyncStorage.getItem(TASTE_STORAGE_KEY);
    if (!raw) return { version: 1, items: [] };
    const parsed = JSON.parse(raw);
    return sanitize(parsed);
  } catch {
    return { version: 1, items: [] };
  }
}

async function _saveToDisk(profile: TasteProfile): Promise<void> {
  await AsyncStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(profile));
}

function _emit(profile: TasteProfile) {
  _listeners.forEach(cb => {
    try { cb(profile); } catch { /* noop */ }
  });
}

/* ---------------- Public API ---------------- */

/** Get the current profile (loads once and caches) */
export async function getTasteProfile(): Promise<TasteProfile> {
  if (_cache) return _cache;
  _cache = await _loadFromDisk();
  return _cache;
}

/** Replace the entire profile (and persist) */
export async function setTasteProfile(next: TasteProfile): Promise<void> {
  _cache = sanitize(next);
  await _saveToDisk(_cache);
  _emit(_cache);
}

/** Subscribe to profile changes; returns an unsubscribe fn */
export function subscribeTasteProfile(listener: (p: TasteProfile) => void): () => void {
  _listeners.add(listener);
  if (_cache) listener(_cache); // emit current immediately
  return () => _listeners.delete(listener);
}

/** Clear everything */
export async function clearTasteProfile(): Promise<void> {
  _cache = { version: 1, items: [] };
  await _saveToDisk(_cache);
  _emit(_cache);
}

/** Export the profile as pretty JSON (for backups/sharing) */
export async function exportTasteProfile(): Promise<string> {
  const p = await getTasteProfile();
  return JSON.stringify(p, null, 2);
}

/** Import a profile JSON; strategy = 'replace' (default) or 'merge' by id */
export async function importTasteProfile(json: string, strategy: 'replace' | 'merge' = 'replace'): Promise<void> {
  let incoming: TasteProfile;
  try {
    incoming = sanitize(JSON.parse(json));
  } catch {
    throw new Error('Invalid TasteProfile JSON');
  }

  const current = await getTasteProfile();

  if (strategy === 'replace') {
    await setTasteProfile({ version: Math.max(current.version, incoming.version), items: incoming.items });
    return;
  }

  // merge by id
  const map = new Map<string, TasteObject>();
  for (const it of current.items) map.set(it.id, it);
  for (const it of incoming.items) map.set(it.id, it);
  await setTasteProfile({ version: Math.max(current.version, incoming.version), items: Array.from(map.values()) });
}

/* ---------------- Convenience CRUD helpers ---------------- */

export type NewTasteInput =
  Omit<TasteObject, 'id' | 'createdAt' | 'updatedAt'> &
  { name: string; kind: TasteKind };

export async function addTaste(input: NewTasteInput): Promise<TasteObject> {
  const p = await getTasteProfile();
  const t: TasteObject = {
    id: rid(),
    name: input.name.trim(),
    kind: input.kind,
    tags: input.tags ?? [],
    rating: input.rating,
    favorite: input.favorite ?? false,
    note: input.note,
    imageUrl: input.imageUrl,
    externalId: input.externalId,
    metadata: input.metadata ?? {},
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  const next: TasteProfile = { ...p, items: [t, ...p.items] };
  await setTasteProfile(next);
  return t;
}

export async function updateTaste(id: string, patch: Partial<Omit<TasteObject, 'id' | 'createdAt'>>): Promise<TasteObject | null> {
  const p = await getTasteProfile();
  let updated: TasteObject | null = null;
  const items = p.items.map(it => {
    if (it.id !== id) return it;
    updated = { ...it, ...patch, updatedAt: nowISO() };
    return updated!;
  });
  if (!updated) return null;
  await setTasteProfile({ ...p, items });
  return updated;
}

export async function removeTaste(id: string): Promise<boolean> {
  const p = await getTasteProfile();
  const next = p.items.filter(it => it.id !== id);
  const removed = next.length !== p.items.length;
  if (removed) await setTasteProfile({ ...p, items: next });
  return removed;
}

export async function setTastes(items: TasteObject[] | ((prev: TasteObject[]) => TasteObject[])): Promise<void> {
  const p = await getTasteProfile();
  const nextItems = typeof items === 'function' ? (items as (prev: TasteObject[]) => TasteObject[])(p.items) : items;
  await setTasteProfile({ ...p, items: nextItems });
}

/* ---------------- Read helpers (non-mutating) ---------------- */

export async function getTastesByKind(kind: TasteKind): Promise<TasteObject[]> {
  const p = await getTasteProfile();
  return p.items.filter(it => it.kind === kind);
}

export async function searchTastes(q: string): Promise<TasteObject[]> {
  const s = q.trim().toLowerCase();
  if (!s) return (await getTasteProfile()).items;
  const { items } = await getTasteProfile();
  return items.filter(it =>
    it.name.toLowerCase().includes(s) ||
    it.tags?.some(t => t.toLowerCase().includes(s)) ||
    it.note?.toLowerCase().includes(s)
  );
}

export async function countTastesByKind(): Promise<Record<TasteKind, number>> {
  const { items } = await getTasteProfile();
  const counts = {} as Record<TasteKind, number>;
  for (const it of items) counts[it.kind] = (counts[it.kind] ?? 0) + 1;
  return counts;
}
