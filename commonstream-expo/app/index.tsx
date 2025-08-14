import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Glow from '@/app/(widgets)/ui/glow';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useUserStorage } from '@/hooks/useUserStorage';

export default function AuthScreen() {
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon') + '22';

  const { profile, loading, updateUserProfile } = useUserStorage();

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (nameModalOpen) {
      setNameDraft(profile?.displayName || '');
    }
  }, [nameModalOpen, profile?.displayName]);

  //const openNameModal = () => setNameModalOpen(true);

  const saveAndContinue = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      await updateUserProfile({ displayName: trimmed });
      router.replace('/home');
    } finally {
      setSaving(false);
      setNameModalOpen(false);
    }
  };

  const hasDisplayName = !!profile?.displayName?.trim();

  const handleContinue = () => {
    if (hasDisplayName) {
      router.replace('/home');
    } else {
      setNameModalOpen(true);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Glow />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading…</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Glow />
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>
            Common
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Stream
          </ThemedText>
        </View>
      </View>

      {/* Footer with continue button -> opens modal */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleContinue}>
          <View style={styles.buttonContent}>
            <Ionicons name="musical-notes" size={24} color="black" style={styles.spotifyIcon} />
            <Text style={styles.loginButtonText}>Continue</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom-sheet modal (no dim overlay) for display name */}
      <Modal
        visible={nameModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNameModalOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: bgColor, borderColor }]}>
              <View style={styles.handle} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ThemedText type="title" style={{ fontSize: 20, flex: 1 }}>
                  Set your display name
                </ThemedText>
                <TouchableOpacity onPress={() => setNameModalOpen(false)}>
                  <Ionicons name="close" size={22} color={textColor} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Display Name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={saveAndContinue}
                style={[
                  styles.input,
                  { backgroundColor: '#fff', color: '#222', borderColor },
                ]}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setNameModalOpen(false)}
                  style={[styles.modalButton, { borderColor }]}
                >
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveAndContinue}
                  disabled={saving || !nameDraft.trim()}
                  style={[
                    styles.modalButton,
                    { borderColor, backgroundColor: '#fff', opacity: saving || !nameDraft.trim() ? 0.6 : 1 },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="save-outline" size={18} color="black" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'black', fontWeight: '600' }}>Save & Continue</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  footer: { alignItems: 'center', paddingBottom: 40, zIndex: 1 },
  titleContainer: { alignItems: 'center' },
  title: { textAlign: 'center', fontSize: 32, fontWeight: 'bold', letterSpacing: 1 },

  loginButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    minWidth: 320,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: { color: 'black', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  spotifyIcon: { marginRight: 12 },
  loadingText: { marginTop: 20, textAlign: 'center', fontSize: 16 },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },

  /* Bottom-sheet styles */
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderTopWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#999',
    marginBottom: 12,
    opacity: 0.6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
});
