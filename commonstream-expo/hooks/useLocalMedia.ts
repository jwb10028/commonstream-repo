// hooks/useLocalMedia.ts
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type Kind = 'avatar' | 'banner';

const MEDIA_DIR = FileSystem.documentDirectory + 'assets/images/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

function filename(kind: Kind, ext = 'jpg') {
  return `${kind}-${Date.now()}.${ext}`;
}

function extFromUri(uri: string) {
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return (m?.[1] || 'jpg').toLowerCase();
}

async function requestLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function pickImageBase(kind: Kind) {
  const ok = await requestLibraryPermission();
  if (!ok) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: (kind === 'banner' ? [16, 9] : [1, 1]) as [number, number],
    quality: 0.9,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

async function saveToAppDir(srcUri: string, kind: Kind) {
  await ensureDir();

  // Optional resize/compress for predictable size
  const ops =
    kind === 'avatar'
      ? [{ resize: { width: 512, height: 512 } }] // square avatar
      : [{ resize: { width: 1600 } }];            // banner, keep 16:9 from picker

  const manipulated = await manipulateAsync(
    srcUri,
    ops as any,
    { compress: 0.85, format: SaveFormat.JPEG }
  );

  const dest = MEDIA_DIR + filename(kind, 'jpg');
  await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
  return dest; // file:///… local URI
}

async function deleteIfLocal(uri?: string | null) {
  if (!uri) return;
  if (!uri.startsWith(FileSystem.documentDirectory!)) return; // only delete our own files
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}

export function useLocalMedia() {
  return {
    /** Pick from gallery, save into app dir, return local URI */
    pickAndSaveAvatar: async () => {
      const picked = await pickImageBase('avatar');
      if (!picked) return null;
      return await saveToAppDir(picked, 'avatar');
    },
    pickAndSaveBanner: async () => {
      const picked = await pickImageBase('banner');
      if (!picked) return null;
      return await saveToAppDir(picked, 'banner');
    },
    /** Remove an existing local file we previously created */
    deleteLocal: deleteIfLocal,

    /** Optional: clear all media we own */
    clearAll: async () => {
      const info = await FileSystem.getInfoAsync(MEDIA_DIR);
      if (info.exists) await FileSystem.deleteAsync(MEDIA_DIR, { idempotent: true });
      await ensureDir();
    },
  };
}
