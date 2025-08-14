import { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile, updateProfile, clearProfile, UserProfile } from '@/data/UserStorage';

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-1',
  displayName: '',
  firstName: '',
  lastName: '',
  country: '',
  avatarUrl: '',
  bio: '',
  preferences: {},
};

export function useUserStorage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let data = await getProfile();
      if (!data) {
        await saveProfile(DEFAULT_PROFILE);
        data = DEFAULT_PROFILE;
      }
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const updateUserProfile = useCallback(async (partial: Partial<UserProfile>) => {
    setLoading(true);
    await updateProfile(partial);
    const updated = await getProfile();
    setProfile(updated);
    setLoading(false);
  }, []);

  const clearUserProfile = useCallback(async () => {
    setLoading(true);
    await clearProfile();
    setProfile({ ...DEFAULT_PROFILE });
    setLoading(false);
  }, []);

  return {
    profile,
    loading,
    updateUserProfile,
    clearUserProfile,
  };
}