import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/context/ThemeContext';
import { useUserStorage } from '@/hooks/useUserStorage';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { profile, loading, updateUserProfile, clearUserProfile } = useUserStorage();
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme || 'light'];

  // Edit Profile sheet
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    country: '',
    bio: '',
  });

  useEffect(() => {
    if (editOpen && profile) {
      setEditForm({
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        country: profile.country || '',
        bio: profile.bio || '',
      });
    }
  }, [editOpen, profile]);

  const saveEditProfile = async () => {
    await updateUserProfile(editForm);
    setEditOpen(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.icon} />
        </View>
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <ThemedText type="title" style={{ marginBottom: 8 }}>
            Profile
          </ThemedText>
          <ThemedText style={{ opacity: 0.7, marginBottom: 16 }}>
            No user data available
          </ThemedText>
          <TouchableOpacity
            onPress={clearUserProfile}
            style={[
              styles.button,
              { borderColor: theme.icon + '33', backgroundColor: theme.background },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
            <ThemedText>Clear Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ===== 1) Banner + Cover (placeholders) ===== */}
        <View style={styles.bannerWrap}>
          <View
            style={[
              styles.banner,
              { backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#c4f0c2' },
            ]}
          >
            <TouchableOpacity style={styles.editChip}>
              <Ionicons name="image-outline" size={14} color="#fff" />
              <ThemedText style={styles.editChipText}>Change Banner</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Avatar overlapping banner bottom-left */}
          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
                ]}
              >
                <Ionicons name="person" size={36} color={theme.icon} />
              </View>
            )}
            <View style={[styles.presenceDot, { borderColor: theme.background }]} />
          </View>
        </View>

        {/* ===== 2) Name + username title row ===== */}
        <View
          style={[
            styles.titleCard,
            { backgroundColor: theme.background, borderColor: theme.icon + '22' },
          ]}
        >
          {/* Name/username box (single line, no wrapping) */}
          <View style={styles.nameBox}>
            <ThemedText
              type="title"
              style={styles.nameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {profile.displayName || 'User'}
            </ThemedText>

            {!!(profile.displayName) && (
              <ThemedText
                style={styles.usernameText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                @{profile.displayName}
              </ThemedText>
            )}
          </View>

          {/* Actions stacked vertically on the right */}
          <View style={styles.actionColumn}>
            <TouchableOpacity style={[styles.pill, { borderColor: theme.icon + '22' }]}>
              <Ionicons name="happy-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
              <ThemedText>Add Status</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditOpen(true)}
              style={[styles.pill, { borderColor: theme.icon + '22' }]}
            >
              <Ionicons name="create-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
              <ThemedText>Edit Profile</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== 3) Stacked sections ===== */}
        {/* Bio (read-only here) */}
        <Section title="Bio" theme={theme}>
          <ThemedText style={{ opacity: 0.8 }}>
            {profile.bio?.trim()
              ? profile.bio
              : 'Tell people what you’re all about!'}
          </ThemedText>
        </Section>

        {/* User details */}
        <Section title="User Details" theme={theme}>
          {/* <DetailRow label="User ID" value={profile.id} theme={theme} /> */}
          {!!profile.firstName && <DetailRow label="First Name" value={profile.firstName} theme={theme} />}
          {!!profile.lastName && <DetailRow label="Last Name" value={profile.lastName} theme={theme} />}
          {!!profile.country && <DetailRow label="Country" value={profile.country} theme={theme} />}
          {!!profile.email && <DetailRow label="Email" value={profile.email} theme={theme} />}
          {!!profile.createdAt && (
            <DetailRow label="Member Since" value={new Date(profile.createdAt).toDateString()} theme={theme} />
          )}
        </Section>

        {/* Connections */}
        <Section title="Connections" theme={theme}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ConnectTile
              icon={<MaterialCommunityIcons name="spotify" size={20} color={theme.text} />}
              title="Spotify"
              connected={!!profile?.connections?.spotify}
              onPress={() => {}}
              theme={theme}
            />
            <ConnectTile
              icon={<Ionicons name="musical-notes-outline" size={20} color={theme.text} />}
              title="Apple Music"
              connected={!!profile?.connections?.appleMusic}
              onPress={() => {}}
              theme={theme}
            />
          </View>
        </Section>

        {/* Clear profile */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={clearUserProfile}
            style={[
              styles.button,
              {
                borderColor: theme.icon + '22',
                backgroundColor: theme.background === '#fff' ? '#fff' : '#3A3A3A',
                marginTop: 4,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
            <ThemedText style={{ color: theme.text }}>Clear Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== Edit Profile Bottom Sheet (no alpha overlay) ===== */}
      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        {/* No backdrop; we just anchor the sheet to the bottom */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.icon + '22' }]}>
              {/* Grab handle */}
              <View style={styles.handle} />

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ThemedText type="title" style={{ fontSize: 20, flex: 1 }}>
                  Edit Profile
                </ThemedText>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Display Name"
                placeholderTextColor="#888"
                value={editForm.displayName}
                onChangeText={(t) => setEditForm((f) => ({ ...f, displayName: t }))}
                style={styles.sheetInput}
              />
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#888"
                value={editForm.firstName}
                onChangeText={(t) => setEditForm((f) => ({ ...f, firstName: t }))}
                style={styles.sheetInput}
              />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#888"
                value={editForm.lastName}
                onChangeText={(t) => setEditForm((f) => ({ ...f, lastName: t }))}
                style={styles.sheetInput}
              />
              <TextInput
                placeholder="Country"
                placeholderTextColor="#888"
                value={editForm.country}
                onChangeText={(t) => setEditForm((f) => ({ ...f, country: t }))}
                style={styles.sheetInput}
              />
              <TextInput
                placeholder="Bio"
                placeholderTextColor="#888"
                value={editForm.bio}
                onChangeText={(t) => setEditForm((f) => ({ ...f, bio: t }))}
                style={[styles.sheetInput, { height: 90 }]}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={saveEditProfile}
                  style={[styles.button, { flex: 1, backgroundColor: theme.tint, borderColor: theme.icon + '22' }]}
                >
                  <Ionicons name="save-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: theme.text }}>Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  style={[styles.button, { flex: 1, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
                >
                  <Ionicons name="close-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

/* ---------- Small helpers ---------- */

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <ThemedText type="title" style={{ fontSize: 18, marginBottom: 10 }}>
        {title}
      </ThemedText>
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.icon + '22',
          backgroundColor: theme.card || theme.background,
          borderRadius: 14,
          padding: 14,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  theme,
}: {
  label: string;
  value?: string;
  theme: any;
}) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
      <ThemedText style={{ opacity: 0.7 }}>{label}</ThemedText>
      <ThemedText style={{ fontWeight: '600' }}>{value}</ThemedText>
    </View>
  );
}

function ConnectTile({
  icon,
  title,
  connected, // reserved
  onPress,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  connected: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.connectTile,
        { borderColor: theme.icon + '22', backgroundColor: theme.background },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon}
        <ThemedText style={{ marginLeft: 8 }}>{title}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const AVATAR = 84;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bannerWrap: { position: 'relative' },
  banner: { height: 140, width: '100%' },

  editChip: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000066',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editChipText: { color: '#fff', marginLeft: 6, fontSize: 12 },

  avatarWrap: {
    position: 'absolute',
    left: 16,
    bottom: -AVATAR / 2,
    width: AVATAR + 8,
    height: AVATAR + 8,
    borderRadius: (AVATAR + 8) / 2,
    backgroundColor: '#0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    borderColor: '#fff',
  },
  presenceDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 3,
  },

  titleCard: {
    marginTop: AVATAR / 2 + 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  nameBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  nameText: {
    fontSize: 24,
  },
  usernameText: {
    opacity: 0.7,
    marginTop: 2,
  },

  actionColumn: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 8,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  connectTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Bottom sheet (no overlay) */
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
  sheetInput: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: '#222',
  },
});
