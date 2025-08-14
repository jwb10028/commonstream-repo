// services/UserStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// ----------------------
// Types
// ----------------------
export type UserProfile = {
  id: string; // "local-1" if single-user device
  displayName?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: {
    temp?: boolean;
  };
};

// ----------------------
// Keys
// ----------------------
const PROFILE_KEY = 'user_profile_local';

// ----------------------
// Profile API
// ----------------------
export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

export async function updateProfile(partial: Partial<UserProfile>): Promise<void> {
  try {
    const current = (await getProfile()) ?? { id: 'local-1' };
    await saveProfile({ ...current, ...partial });
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Error clearing profile:', error);
  }
}
