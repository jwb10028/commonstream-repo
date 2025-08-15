// app/(widgets)/modals/taste_modal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTasteStorage } from '@/hooks/useTasteStorage';
import type { TasteKind } from '@/data/TasteStorage';

type Props = { visible: boolean; onClose: () => void };

type TasteObjectLike = {
  id: string;
  kind: TasteKind;
  name: string;
  tags?: string[];
  rating?: number;
  note?: string;
  favorite?: boolean;
  createdAt?: string | number;
};

const { height } = Dimensions.get('window');
const ALL_KINDS: TasteKind[] = [
  'music', 'artist', 'album', 'playlist', 'movie', 'tv', 'game', 'book', 'podcast', 'other',
];

function iconForKind(kind: TasteKind) {
  // Keep this simple; mix Ionicons/MaterialCommunityIcons as needed
  switch (kind) {
    case 'music':    return { Icon: Ionicons, name: 'musical-notes-outline' as const };
    case 'artist':   return { Icon: MaterialCommunityIcons, name: 'account-music-outline' as const };
    case 'album':    return { Icon: MaterialCommunityIcons, name: 'album' as const };
    case 'playlist': return { Icon: MaterialCommunityIcons, name: 'playlist-music' as const };
    case 'movie':    return { Icon: MaterialCommunityIcons, name: 'movie-outline' as const };
    case 'tv':       return { Icon: MaterialCommunityIcons, name: 'television' as const };
    case 'game':     return { Icon: MaterialCommunityIcons, name: 'gamepad-variant-outline' as const };
    case 'book':     return { Icon: MaterialCommunityIcons, name: 'book-outline' as const };
    case 'podcast':  return { Icon: MaterialCommunityIcons, name: 'podcast' as const };
    default:         return { Icon: MaterialCommunityIcons, name: 'star-outline' as const };
  }
}

function Chip({
  label,
  selected,
  onPress,
  textColor,
  borderColor,
  background,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  textColor: string;
  borderColor: string;
  background: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor,
          backgroundColor: selected ? (textColor + '12') : background,
        },
      ]}
    >
      <ThemedText style={{ color: textColor, fontWeight: selected ? '700' : '500' }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

function TasteRow({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  borderColor,
  textColor,
  iconColor,
  backgroundCard,
}: {
  item: TasteObjectLike;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  borderColor: string;
  textColor: string;
  iconColor: string;
  backgroundCard: string;
}) {
  const { Icon, name } = iconForKind(item.kind);
  return (
    <View style={[styles.tasteRow, { borderColor, backgroundColor: backgroundCard }]}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
        <Icon name={name as any} size={18} color={textColor} />
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" style={{ color: textColor }} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={{ color: iconColor, fontSize: 12 }} numberOfLines={1}>
            {item.kind}
            {item.rating != null ? ` • ${item.rating}/10` : ''}
            {item.tags?.length ? ` • ${item.tags.join(', ')}` : ''}
          </ThemedText>
          {!!item.note && (
            <ThemedText style={{ color: iconColor, fontSize: 12 }} numberOfLines={2}>
              {item.note}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.tasteActions}>
        <TouchableOpacity onPress={onToggleFavorite} style={[styles.iconBtn, { borderColor }]}>
          <Ionicons name={item.favorite ? 'star' : 'star-outline'} size={16} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor, marginLeft: 8 }]}>
          <Ionicons name="create-outline" size={16} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor, marginLeft: 8 }]}>
          <Ionicons name="trash-outline" size={16} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TasteModal({ visible, onClose }: Props) {
  // Theme
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundCard = useMemo(() => (background === '#fff' ? '#F8F8F8' : '#2A2A2A'), [background]);
  const borderSoft = iconColor + '33';

  // Storage
  const {
    profile,
    addTaste,
    updateTaste,
    removeTaste,
    clear,
    refresh,
  } = useTasteStorage();

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  // Add state
  const [addingOpen, setAddingOpen] = useState(false);
  const [newKind, setNewKind] = useState<TasteKind>('music');
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newRating, setNewRating] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newFav, setNewFav] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKind, setEditKind] = useState<TasteKind>('music');
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editRating, setEditRating] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFav, setEditFav] = useState(false);

  const startEdit = (t: TasteObjectLike) => {
    setEditingId(t.id);
    setEditKind(t.kind);
    setEditName(t.name);
    setEditTags((t.tags ?? []).join(', '));
    setEditRating(t.rating != null ? String(t.rating) : '');
    setEditNote(t.note ?? '');
    setEditFav(!!t.favorite);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTags('');
    setEditRating('');
    setEditNote('');
    setEditFav(false);
  };

  const parseTags = (s: string) =>
    s.split(',').map(x => x.trim()).filter(Boolean);

  const clampRating = (n: number) => Math.max(0, Math.min(10, n));

  const saveNew = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    const tags = parseTags(newTags);
    const rating = newRating.trim() === '' ? undefined : clampRating(Number(newRating));
    try {
      await addTaste({
        name,
        kind: newKind,
        tags,
        rating: Number.isFinite(rating as number) ? (rating as number) : undefined,
        note: newNote.trim() || undefined,
        favorite: newFav,
      } as any);
      setNewName('');
      setNewTags('');
      setNewRating('');
      setNewNote('');
      setNewFav(false);
      setNewKind('music');
      setAddingOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to add taste.');
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    const tags = parseTags(editTags);
    const rating = editRating.trim() === '' ? undefined : clampRating(Number(editRating));
    try {
      await updateTaste(editingId, {
        name,
        kind: editKind,
        tags,
        rating: Number.isFinite(rating as number) ? (rating as number) : undefined,
        note: editNote.trim() || undefined,
        favorite: editFav,
      } as any);
      cancelEdit();
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete taste?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTaste(id);
            if (editingId === id) cancelEdit();
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const confirmClear = () => {
    Alert.alert('Clear all tastes?', 'This will remove all items.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { try { await clear(); } catch {} } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Transparent overlay (no dim) */}
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { height: height * 0.8, backgroundColor: background, borderColor: borderSoft }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
                Tastes
              </ThemedText>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={confirmClear} style={[styles.smallBtn, { borderColor: borderSoft }]}>
                  <ThemedText style={{ color: textColor, fontSize: 12 }}>Clear all</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{ marginLeft: 8, padding: 6 }}>
                  <Ionicons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>
            </View>

            <ThemedText style={[styles.subhead, { color: iconColor }]}>
              Manage your saved artists, albums, playlists, and more. Add new tastes or edit existing ones below.
            </ThemedText>

            {/* Add-new composer */}
            <View style={[styles.addWrap, { borderColor: borderSoft }]}>
              <TouchableOpacity
                onPress={() => setAddingOpen(o => !o)}
                style={[styles.addHeader, { backgroundColor: backgroundCard }]}
              >
                <Ionicons name={addingOpen ? 'chevron-down' : 'chevron-forward'} size={16} color={iconColor} />
                <ThemedText style={{ color: textColor, fontWeight: '600' }}>Add new taste</ThemedText>
              </TouchableOpacity>

              {addingOpen && (
                <View style={styles.addBody}>
                  {/* kind chips */}
                  <View style={styles.kindsWrap}>
                    {ALL_KINDS.map(k => (
                      <Chip
                        key={k}
                        label={k}
                        selected={newKind === k}
                        onPress={() => setNewKind(k)}
                        textColor={textColor}
                        borderColor={borderSoft}
                        background={background}
                      />
                    ))}
                  </View>

                  <TextInput
                    placeholder="Name (required)"
                    placeholderTextColor={iconColor}
                    value={newName}
                    onChangeText={setNewName}
                    style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                  />
                  <TextInput
                    placeholder="Tags (comma-separated)"
                    placeholderTextColor={iconColor}
                    value={newTags}
                    onChangeText={setNewTags}
                    style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                  />
                  <TextInput
                    placeholder="Rating (0-10)"
                    placeholderTextColor={iconColor}
                    value={newRating}
                    onChangeText={t => setNewRating(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                  />
                  <TextInput
                    placeholder="Notes"
                    placeholderTextColor={iconColor}
                    value={newNote}
                    onChangeText={setNewNote}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: borderSoft, backgroundColor: background, height: 90, textAlignVertical: 'top' },
                    ]}
                    multiline
                  />

                  {/* favorite toggle */}
                  <TouchableOpacity
                    onPress={() => setNewFav(v => !v)}
                    style={[styles.favToggle, { borderColor: borderSoft, backgroundColor: background }]}
                  >
                    <Ionicons name={newFav ? 'star' : 'star-outline'} size={16} color={textColor} />
                    <ThemedText style={{ color: textColor, marginLeft: 6 }}>Favorite</ThemedText>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => { setAddingOpen(false); setNewName(''); setNewTags(''); setNewRating(''); setNewNote(''); setNewFav(false); setNewKind('music'); }}
                      style={[styles.actionBtn, { borderColor: borderSoft, backgroundColor: background }]}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveNew} style={[styles.actionBtn, { borderColor: borderSoft, backgroundColor: background }]}>
                      <Ionicons name="save-outline" size={16} color={textColor} />
                      <ThemedText style={{ marginLeft: 6 }}>Save</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {profile.items.length === 0 ? (
                <ThemedText style={{ color: iconColor, paddingVertical: 16 }}>
                  No tastes yet. Tap “Add new taste” to create one.
                </ThemedText>
              ) : (
                profile.items.map((t: TasteObjectLike) =>
                  editingId === t.id ? (
                    <View key={t.id} style={[styles.editCard, { borderColor: borderSoft, backgroundColor: backgroundCard }]}>
                      <ThemedText style={{ color: textColor, fontWeight: '600', marginBottom: 8 }}>
                        Edit taste
                      </ThemedText>

                      {/* kind chips */}
                      <View style={styles.kindsWrap}>
                        {ALL_KINDS.map(k => (
                          <Chip
                            key={k}
                            label={k}
                            selected={editKind === k}
                            onPress={() => setEditKind(k)}
                            textColor={textColor}
                            borderColor={borderSoft}
                            background={background}
                          />
                        ))}
                      </View>

                      <TextInput
                        placeholder="Name (required)"
                        placeholderTextColor={iconColor}
                        value={editName}
                        onChangeText={setEditName}
                        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                      />
                      <TextInput
                        placeholder="Tags (comma-separated)"
                        placeholderTextColor={iconColor}
                        value={editTags}
                        onChangeText={setEditTags}
                        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                      />
                      <TextInput
                        placeholder="Rating (0-10)"
                        placeholderTextColor={iconColor}
                        value={editRating}
                        onChangeText={t => setEditRating(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="numeric"
                        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                      />
                      <TextInput
                        placeholder="Notes"
                        placeholderTextColor={iconColor}
                        value={editNote}
                        onChangeText={setEditNote}
                        style={[
                          styles.input,
                          { color: textColor, borderColor: borderSoft, backgroundColor: background, height: 100, textAlignVertical: 'top' },
                        ]}
                        multiline
                      />

                      <TouchableOpacity
                        onPress={() => setEditFav(v => !v)}
                        style={[styles.favToggle, { borderColor: borderSoft, backgroundColor: background }]}
                      >
                        <Ionicons name={editFav ? 'star' : 'star-outline'} size={16} color={textColor} />
                        <ThemedText style={{ color: textColor, marginLeft: 6 }}>Favorite</ThemedText>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                        <TouchableOpacity onPress={cancelEdit} style={[styles.actionBtn, { borderColor: borderSoft, backgroundColor: background }]}>
                          <ThemedText>Cancel</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEdit} style={[styles.actionBtn, { borderColor: borderSoft, backgroundColor: background }]}>
                          <Ionicons name="save-outline" size={16} color={textColor} />
                          <ThemedText style={{ marginLeft: 6 }}>Save</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TasteRow
                      key={t.id}
                      item={t}
                      onEdit={() => startEdit(t)}
                      onDelete={() => handleDelete(t.id)}
                      onToggleFavorite={() => updateTaste(t.id, { favorite: !t.favorite })}
                      borderColor={borderSoft}
                      textColor={textColor}
                      iconColor={iconColor}
                      backgroundCard={backgroundCard}
                    />
                  )
                )
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // no alpha overlay
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    borderTopWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#999',
    marginBottom: 10,
    opacity: 0.6,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  subhead: { opacity: 0.7, marginBottom: 12 },

  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },

  addWrap: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 12,
  },
  addHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  addBody: { padding: 12, gap: 10 },

  kindsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  tasteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tasteActions: { flexDirection: 'row', marginLeft: 8 },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },

  editCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 10 },

  favToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
