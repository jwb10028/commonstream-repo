import React, { useEffect, useState, useRef } from 'react';
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
import { useLocalMedia } from '@/hooks/useLocalMedia';
import { useTasteStorage } from '@/hooks/useTasteStorage';
import { Colors } from '@/constants/Colors';
import type { TasteKind } from '@/data/TasteStorage';

export default function ProfileScreen() {
  const { profile, loading, updateUserProfile, clearUserProfile } = useUserStorage();
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme || 'light'];

  // Tastes data
  const {
    profile: tasteProfile,
    addTaste,
  } = useTasteStorage();

  // Edit Profile sheet
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    country: '',
    bio: '',
  });

  // Edit Images sheet (local media)
  const { pickAndSaveAvatar, pickAndSaveBanner, deleteLocal } = useLocalMedia();
  const [imagesOpen, setImagesOpen] = useState(false);
  const [imagesForm, setImagesForm] = useState<{ bannerUrl?: string; avatarUrl?: string }>({});
  const tempFilesRef = useRef<string[]>([]); // track newly created files until user saves

  // Add Taste sheet
  const [tasteOpen, setTasteOpen] = useState(false);
  const [tasteStep, setTasteStep] = useState<'kind' | 'form'>('kind');
  const [tasteDraft, setTasteDraft] = useState<{
    kind: TasteKind | null;
    name: string;
    tagsText: string;
    ratingText: string;
    note: string;
  }>({
    kind: null,
    name: '',
    tagsText: '',
    ratingText: '',
    note: '',
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

  // preload images sheet with existing values
  useEffect(() => {
    if (imagesOpen && profile) {
      setImagesForm({
        bannerUrl: profile.bannerUrl || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [imagesOpen, profile]);

  const saveEditProfile = async () => {
    await updateUserProfile(editForm);
    setEditOpen(false);
  };

  // ---- Images handlers (local) ----
  const chooseBanner = async () => {
    const uri = await pickAndSaveBanner();
    if (uri) {
      tempFilesRef.current.push(uri);
      setImagesForm(f => ({ ...f, bannerUrl: uri }));
    }
  };

  const chooseAvatar = async () => {
    const uri = await pickAndSaveAvatar();
    if (uri) {
      tempFilesRef.current.push(uri);
      setImagesForm(f => ({ ...f, avatarUrl: uri }));
    }
  };

  const saveImages = async () => {
    // delete previously saved local files if they are replaced
    if (imagesForm.avatarUrl && imagesForm.avatarUrl !== profile?.avatarUrl) {
      await deleteLocal(profile?.avatarUrl);
    }
    if (imagesForm.bannerUrl && imagesForm.bannerUrl !== profile?.bannerUrl) {
      await deleteLocal(profile?.bannerUrl);
    }

    await updateUserProfile({
      avatarUrl: imagesForm.avatarUrl ?? profile?.avatarUrl ?? '',
      bannerUrl: imagesForm.bannerUrl ?? profile?.bannerUrl ?? '',
    });

    tempFilesRef.current = []; // we keep newly saved files
    setImagesOpen(false);
  };

  const cancelImages = async () => {
    await Promise.all(tempFilesRef.current.map(deleteLocal));
    tempFilesRef.current = [];
    setImagesOpen(false);
  };

  // ---- Taste handlers ----
  const openAddTaste = () => {
    setTasteDraft({ kind: null, name: '', tagsText: '', ratingText: '', note: '' });
    setTasteStep('kind');
    setTasteOpen(true);
  };

  const cancelTaste = () => {
    setTasteOpen(false);
  };

  const backTaste = () => {
    if (tasteStep === 'form') setTasteStep('kind');
    else cancelTaste();
  };

  const proceedToForm = (kind: TasteKind) => {
    setTasteDraft(d => ({ ...d, kind }));
    setTasteStep('form');
  };

  const saveTaste = async () => {
    if (!tasteDraft.kind || !tasteDraft.name.trim()) return;
    const tags = tasteDraft.tagsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const rating = tasteDraft.ratingText.trim() === '' ? undefined : Math.max(0, Math.min(10, Number(tasteDraft.ratingText)));
    await addTaste({
      name: tasteDraft.name.trim(),
      kind: tasteDraft.kind,
      tags,
      rating: Number.isFinite(rating as number) ? (rating as number) : undefined,
      note: tasteDraft.note.trim() || undefined,
    });
    setTasteOpen(false);
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

  // When editing images, show the live-picked banner; otherwise use saved profile.bannerUrl
  const bannerSrc = imagesOpen ? imagesForm.bannerUrl || profile.bannerUrl : profile.bannerUrl;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ===== 1) Banner + Cover ===== */}
        <View style={styles.bannerWrap}>
          <View style={styles.banner}>
            {bannerSrc ? (
              <Image
                source={{ uri: bannerSrc }}
                style={StyleSheet.absoluteFillObject as any}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFillObject as any,
                  { backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#c4f0c2' },
                ]}
              />
            )}

            {/* Edit Images */}
            <TouchableOpacity style={styles.editChip} onPress={() => setImagesOpen(true)}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <ThemedText style={styles.editChipText}>Edit Images</ThemedText>
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
          {/* Name/username (single line, no wrapping) */}
          <View style={styles.nameBox}>
            <ThemedText
              type="title"
              style={styles.nameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {profile.displayName || 'User'}
            </ThemedText>

            {!!profile.displayName && (
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
            {profile.bio?.trim() ? profile.bio : 'Tell people what you’re all about!'}
          </ThemedText>
        </Section>

        {/* User details */}
        <Section title="User Details" theme={theme}>
          {!!profile.firstName && <DetailRow label="First Name" value={profile.firstName} theme={theme} />}
          {!!profile.lastName && <DetailRow label="Last Name" value={profile.lastName} theme={theme} />}
          {!!profile.country && <DetailRow label="Country" value={profile.country} theme={theme} />}
          {!!profile.email && <DetailRow label="Email" value={profile.email} theme={theme} />}
          {!!profile.createdAt && (
            <DetailRow
              label="Member Since"
              value={new Date(profile.createdAt).toDateString()}
              theme={theme}
            />
          )}
        </Section>

        {/* Tastes */}
        <Section
          title="Tastes"
          theme={theme}
          right={
            <TouchableOpacity onPress={openAddTaste} style={[styles.iconBtn, { borderColor: theme.icon + '22' }]}>
              <Ionicons name="add" size={18} color={theme.text} />
            </TouchableOpacity>
          }
        >
          {tasteProfile.items.length === 0 ? (
            <ThemedText style={{ opacity: 0.7 }}>
              Nothing here yet. Tap + to add your first taste.
            </ThemedText>
          ) : (
            <View style={{ gap: 10 }}>
              {tasteProfile.items.map(item => (
                <TasteRow key={item.id} item={item} theme={theme} />
              ))}
            </View>
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

      {/* ===== Edit Profile Bottom Sheet (no overlay) ===== */}
      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.icon + '22' }]}>
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
                  style={[styles.button, { flex: 1, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
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

      {/* ===== Add Taste Bottom Sheet (no overlay) ===== */}
      <Modal
        visible={tasteOpen}
        animationType="slide"
        transparent
        onRequestClose={cancelTaste}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.icon + '22' }]}>
              <View style={styles.handle} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ThemedText type="title" style={{ fontSize: 20, flex: 1 }}>
                  {tasteStep === 'kind' ? 'Select Taste Type' : 'Add Taste'}
                </ThemedText>
                <TouchableOpacity onPress={cancelTaste}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {tasteStep === 'kind' ? (
                <>
                  <KindGrid onSelect={proceedToForm} theme={theme} />
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={cancelTaste}
                      style={[styles.button, { backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ marginBottom: 10 }}>
                    <ThemedText style={{ opacity: 0.7, marginBottom: 6 }}>
                      Type: {tasteDraft.kind}
                    </ThemedText>
                    <TextInput
                      placeholder="Name (required)"
                      placeholderTextColor="#888"
                      value={tasteDraft.name}
                      onChangeText={(t) => setTasteDraft(d => ({ ...d, name: t }))}
                      style={styles.sheetInput}
                    />
                    <TextInput
                      placeholder="Tags (comma-separated)"
                      placeholderTextColor="#888"
                      value={tasteDraft.tagsText}
                      onChangeText={(t) => setTasteDraft(d => ({ ...d, tagsText: t }))}
                      style={styles.sheetInput}
                    />
                    <TextInput
                      placeholder="Rating (0-10)"
                      placeholderTextColor="#888"
                      value={tasteDraft.ratingText}
                      onChangeText={(t) => setTasteDraft(d => ({ ...d, ratingText: t.replace(/[^0-9.]/g, '') }))}
                      keyboardType="numeric"
                      style={styles.sheetInput}
                    />
                    <TextInput
                      placeholder="Notes"
                      placeholderTextColor="#888"
                      value={tasteDraft.note}
                      onChangeText={(t) => setTasteDraft(d => ({ ...d, note: t }))}
                      style={[styles.sheetInput, { height: 90 }]}
                      multiline
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={backTaste}
                      style={[styles.button, { flex: 1, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
                    >
                      <ThemedText>Back</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={saveTaste}
                      disabled={!tasteDraft.name.trim() || !tasteDraft.kind}
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor: theme.background,
                          borderColor: theme.icon + '22',
                          opacity: !tasteDraft.name.trim() || !tasteDraft.kind ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="save-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                      <ThemedText>Save</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ===== Edit Images Bottom Sheet (no overlay) ===== */}
      <Modal
        visible={imagesOpen}
        animationType="slide"
        transparent
        onRequestClose={cancelImages}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.icon + '22' }]}>
              <View style={styles.handle} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ThemedText type="title" style={{ fontSize: 20, flex: 1 }}>
                  Edit Images
                </ThemedText>
                <TouchableOpacity onPress={cancelImages}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Banner picker + preview */}
              <ThemedText style={{ marginBottom: 6 }}>Banner</ThemedText>
              <View style={styles.bannerPreview}>
                {imagesForm.bannerUrl || bannerSrc ? (
                  <Image
                    source={{ uri: imagesForm.bannerUrl || bannerSrc }}
                    style={StyleSheet.absoluteFillObject as any}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      StyleSheet.absoluteFillObject as any,
                      { backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#c4f0c2' },
                    ]}
                  />
                )}
              </View>
              <TouchableOpacity
                onPress={chooseBanner}
                style={[styles.button, { marginBottom: 12, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
              >
                <Ionicons name="image-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                <ThemedText>Choose Banner</ThemedText>
              </TouchableOpacity>

              {/* Avatar picker + preview */}
              <ThemedText style={{ marginBottom: 6 }}>Profile Photo</ThemedText>
              <View style={styles.avatarPreviewWrap}>
                <View style={styles.avatarPreview}>
                  {imagesForm.avatarUrl || profile.avatarUrl ? (
                    <Image
                      source={{ uri: imagesForm.avatarUrl || profile.avatarUrl }}
                      style={StyleSheet.absoluteFillObject as any}
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject as any, { backgroundColor: '#eee' }]} />
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={chooseAvatar}
                style={[styles.button, { marginBottom: 8, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
              >
                <Ionicons name="person-circle-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                <ThemedText>Choose Profile Photo</ThemedText>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={saveImages}
                  style={[styles.button, { flex: 1, backgroundColor: theme.background, borderColor: theme.icon + '22' }]}
                >
                  <Ionicons name="save-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: theme.text }}>Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cancelImages}
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
  right,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <ThemedText type="title" style={{ fontSize: 18, flex: 1 }}>
          {title}
        </ThemedText>
        {right ?? null}
      </View>
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

function TasteRow({ item, theme }: { item: any; theme: any }) {
  const { iconName, mc } = iconForKind(item.kind);
  const IconCmp = mc ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <IconCmp name={iconName as any} size={18} color={theme.text} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <ThemedText style={{ fontWeight: '600' }} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>
          {item.kind}{item.rating != null ? ` • ${item.rating}/10` : ''}
        </ThemedText>
      </View>
      {item.favorite ? (
        <Ionicons name="star" size={14} color={theme.text} />
      ) : null}
    </View>
  );
}

function KindGrid({ onSelect, theme }: { onSelect: (k: TasteKind) => void; theme: any }) {
  const kinds: TasteKind[] = ['music', 'artist', 'album', 'playlist', 'movie', 'tv', 'game', 'book', 'podcast', 'other'];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {kinds.map(k => {
        const { iconName, mc } = iconForKind(k);
        const IconCmp = mc ? MaterialCommunityIcons : Ionicons;
        return (
          <TouchableOpacity
            key={k}
            onPress={() => onSelect(k)}
            style={[styles.kindChip, { borderColor: theme.icon + '22', backgroundColor: theme.background }]}
          >
            <IconCmp name={iconName as any} size={16} color={theme.text} />
            <ThemedText style={{ marginLeft: 6 }}>{k}</ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function iconForKind(kind: TasteKind) {
  switch (kind) {
    case 'music': return { iconName: 'musical-notes-outline', mc: false };
    case 'artist': return { iconName: 'account-music-outline', mc: true };
    case 'album': return { iconName: 'album', mc: true };
    case 'playlist': return { iconName: 'playlist-music', mc: true };
    case 'movie': return { iconName: 'movie-outline', mc: true };
    case 'tv': return { iconName: 'television', mc: true };
    case 'game': return { iconName: 'gamepad-variant-outline', mc: true };
    case 'book': return { iconName: 'book-outline', mc: true };
    case 'podcast': return { iconName: 'podcast', mc: true };
    default: return { iconName: 'star-outline', mc: true };
  }
}

/* ---------- Styles ---------- */

const AVATAR = 84;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bannerWrap: { position: 'relative' },
  banner: { height: 140, width: '100%', overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#00000011' },

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

  iconBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
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

  /* Bottom sheets (no overlay) */
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

  bannerPreview: {
    height: 120,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  avatarPreviewWrap: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatarPreview: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
  },

  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});
