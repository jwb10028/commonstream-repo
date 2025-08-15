// app/(widgets)/modals/sprompt_modal.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import useSysPromptStorage from '@/hooks/useSysPromptStorage';

type Props = { visible: boolean; onClose: () => void };

type SysPrompt = {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  tags?: string[];
  createdAt?: string | number;
  updatedAt?: string | number;
};

const { height } = Dimensions.get('window');

function PromptRow({
  prompt,
  onToggle,
  onEdit,
  onDelete,
  textColor,
  iconColor,
  borderColor,
  backgroundCard,
}: {
  prompt: SysPrompt;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  textColor: string;
  iconColor: string;
  borderColor: string;
  backgroundCard: string;
}) {
  return (
    <View style={[styles.promptRow, { borderColor, backgroundColor: backgroundCard }]}>
      <View style={styles.promptLeft}>
        <TouchableOpacity onPress={onToggle} style={styles.checkboxHit}>
          <Ionicons
            name={prompt.enabled ? 'checkbox-outline' : 'square-outline'}
            size={20}
            color={textColor}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" style={[styles.promptTitle, { color: textColor }]} numberOfLines={1}>
            {prompt.title || 'Untitled prompt'}
          </ThemedText>
          {!!prompt.content && (
            <ThemedText style={[styles.promptPreview, { color: iconColor }]} numberOfLines={2}>
              {prompt.content}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.promptActions}>
        <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { borderColor }]}>
          <Ionicons name="create-outline" size={16} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { borderColor, marginLeft: 8 }]}>
          <Ionicons name="trash-outline" size={16} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SysPromptModal({ visible, onClose }: Props) {
  // Theme
  const background = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundCard = useMemo(() => (background === '#fff' ? '#F8F8F8' : '#2A2A2A'), [background]);
  const borderSoft = iconColor + '33';

  // Storage (correct API)
  const {
    items,                // <— the list to render
    addPrompt,
    updatePrompt,
    togglePrompt,
    removePrompt,
    refresh,              // <— call on open for fresh load
  } = useSysPromptStorage();

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  // Inline editing/new states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [addingOpen, setAddingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const startEdit = (p: SysPrompt) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title) {
      Alert.alert('Title required', 'Please enter a title for this system prompt.');
      return;
    }
    try {
      await updatePrompt(editingId, { title, content });
      cancelEdit();
      // no need to refresh; hook updates state after mutation
    } catch {
      Alert.alert('Error', 'Failed to save prompt. Please try again.');
    }
  };

  const saveNew = async () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title) {
      Alert.alert('Title required', 'Please enter a title for the new system prompt.');
      return;
    }
    try {
      await addPrompt({ title, content, enabled: true });
      setNewTitle('');
      setNewContent('');
      setAddingOpen(false);
      // hook updates state after mutation
    } catch {
      Alert.alert('Error', 'Failed to add prompt. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete prompt?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePrompt(id);
            if (editingId === id) cancelEdit();
          } catch {
            Alert.alert('Error', 'Failed to delete prompt.');
          }
        },
      },
    ]);
  };

  const handleToggle = async (p: SysPrompt) => {
    try {
      await togglePrompt(p.id, !p.enabled);
    } catch {
      Alert.alert('Error', 'Failed to update prompt.');
    }
  };

  const enableAll = async () => {
    try {
      await Promise.all(items.map(p => togglePrompt(p.id, true)));
    } catch {
      Alert.alert('Error', 'Failed to enable prompts.');
    }
  };

  const disableAll = async () => {
    try {
      await Promise.all(items.map(p => togglePrompt(p.id, false)));
    } catch {
      Alert.alert('Error', 'Failed to disable prompts.');
    }
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
                System Prompts
              </ThemedText>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={enableAll} style={[styles.smallBtn, { borderColor: borderSoft }]}>
                  <ThemedText style={{ color: textColor, fontSize: 12 }}>Enable all</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={disableAll} style={[styles.smallBtn, { borderColor: borderSoft, marginLeft: 8 }]}>
                  <ThemedText style={{ color: textColor, fontSize: 12 }}>Disable all</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{ marginLeft: 8, padding: 6 }}>
                  <Ionicons name="close" size={20} color={textColor} />
                </TouchableOpacity>
              </View>
            </View>

            <ThemedText style={[styles.subhead, { color: iconColor }]}>
              Select which system prompts should apply to your queries. You can add, edit, or remove prompts below.
            </ThemedText>

            {/* Add-new composer */}
            <View style={[styles.addWrap, { borderColor: borderSoft }]}>
              <TouchableOpacity onPress={() => setAddingOpen(o => !o)} style={[styles.addHeader, { backgroundColor: backgroundCard }]}>
                <Ionicons name={addingOpen ? 'chevron-down' : 'chevron-forward'} size={16} color={iconColor} />
                <ThemedText style={{ color: textColor, fontWeight: '600' }}>Add new prompt</ThemedText>
              </TouchableOpacity>

              {addingOpen && (
                <View style={styles.addBody}>
                  <TextInput
                    placeholder="Title"
                    placeholderTextColor={iconColor}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                  />
                  <TextInput
                    placeholder="Prompt content"
                    placeholderTextColor={iconColor}
                    value={newContent}
                    onChangeText={setNewContent}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: borderSoft, backgroundColor: background, height: 100, textAlignVertical: 'top' },
                    ]}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => { setNewTitle(''); setNewContent(''); setAddingOpen(false); }}
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
              {items.length === 0 ? (
                <ThemedText style={{ color: iconColor, paddingVertical: 16 }}>
                  No prompts yet. Tap “Add new prompt” to create one.
                </ThemedText>
              ) : (
                items.map((p: SysPrompt) =>
                  editingId === p.id ? (
                    <View key={p.id} style={[styles.editCard, { borderColor: borderSoft, backgroundColor: backgroundCard }]}>
                      <ThemedText style={{ color: textColor, fontWeight: '600', marginBottom: 8 }}>Edit prompt</ThemedText>
                      <TextInput
                        placeholder="Title"
                        placeholderTextColor={iconColor}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: background }]}
                      />
                      <TextInput
                        placeholder="Prompt content"
                        placeholderTextColor={iconColor}
                        value={editContent}
                        onChangeText={setEditContent}
                        style={[
                          styles.input,
                          { color: textColor, borderColor: borderSoft, backgroundColor: background, height: 110, textAlignVertical: 'top' },
                        ]}
                        multiline
                      />
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
                    <PromptRow
                      key={p.id}
                      prompt={p}
                      onToggle={() => handleToggle(p)}
                      onEdit={() => startEdit(p)}
                      onDelete={() => handleDelete(p.id)}
                      textColor={textColor}
                      iconColor={iconColor}
                      borderColor={borderSoft}
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

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  promptLeft: { flex: 1, flexDirection: 'row', gap: 10 },
  checkboxHit: { paddingVertical: 4, paddingRight: 6 },
  promptTitle: { fontSize: 15, fontWeight: '600' },
  promptPreview: { fontSize: 12, marginTop: 2 },
  promptActions: { flexDirection: 'row', marginLeft: 8 },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },

  editCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 10 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
