import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import KeyboardToolbar from './keyboard-toolbar';
import QueryModal from '../modals/query_modal';
import { GroqService } from '@/services/GroqAPI';
import { TrackMatchingService } from '@/services/TrackMatchingAPI';
import type { GeneratedPlaylist } from '@/types/Groq';
import type { TrackMatchingResponse } from '@/types/TrackMatching';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import useSysPromptStorage from '@/hooks/useSysPromptStorage';
import { useTasteStorage } from '@/hooks/useTasteStorage';

type ModeKey = 'create' | 'find' | 'refs' | 'muso';
const MODES: { key: ModeKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'create', label: 'Create playlist…', icon: 'albums-outline' },
  { key: 'find',   label: 'Find a…',          icon: 'search-outline' },
  { key: 'refs',   label: 'Check for references', icon: 'book-outline' },
  { key: 'muso',   label: 'Muso check',       icon: 'mic-outline' },
];

export default function HomeQuery() {
  const [queryText, setQueryText] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [playlist, setPlaylist] = useState<GeneratedPlaylist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track matching
  const [trackMatches, setTrackMatches] = useState<TrackMatchingResponse | null>(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  // Spotify
  const { tokens } = useSpotifyAuth();

  // System prompts + tastes
  const { buildForLLM } = useSysPromptStorage();
  const { profile: tasteProfile } = useTasteStorage();

  // Mode + dropdown
  const [mode, setMode] = useState<typeof MODES[number]>(MODES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownBtnLayout, setDropdownBtnLayout] = useState<{ width: number; height: number } | null>(null);

  // Params (system applies to all modes; tastes/discog only for create)
  const [includeSystem, setIncludeSystem] = useState(true);
  const [includeTastes, setIncludeTastes] = useState(false);
  const [includeDiscog, setIncludeDiscog] = useState(false);

  // Theme
  const borderColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');

  // Keyboard listeners
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, () => setIsKeyboardVisible(true));
    const h = Keyboard.addListener(hideEvt, () => setIsKeyboardVisible(false));
    return () => { s.remove(); h.remove(); };
  }, []);

  const handleVoiceActivation = () => console.log('Voice activation button pressed');
  const handleLoopbackListening = () => console.log('Loopback listening button pressed');
  const handleAddMedia = () => console.log('Add media button pressed');

  const handleSelectMode = (m: typeof MODES[number]) => {
    setMode(m);
    setShowDropdown(false);
  };

  const buildCompositePrompt = async (userQuery: string) => {
    const blocks: string[] = [];

    // System prompts (enabled for ALL modes if checked)
    if (includeSystem) {
      const sys = await buildForLLM();
      if (sys.length) blocks.push(sys.map(s => `[SYS] ${s}`).join('\n\n'));
    }

    // Tastes (create-only)
    if (mode.key === 'create' && includeTastes && tasteProfile.items.length) {
      const sampled = tasteProfile.items.slice(0, 12).map(t => `${t.kind}:${t.name}`);
      blocks.push(`[TASTE] ${sampled.join(' | ')}`);
    }

    // Discog (create-only; placeholder)
    if (mode.key === 'create' && includeDiscog) {
      blocks.push('[DISCOG] Include relevant discography context for artists/genres mentioned.');
    }

    blocks.push(`[USER] ${userQuery}`);
    return blocks.join('\n\n');
  };

  const handleQuerySubmit = async () => {
    const userQuery = queryText.trim();
    if (!userQuery) {
      Alert.alert('Error', 'Please enter a request');
      return;
    }

    // Update UI immediately
    setLastQuery(userQuery);
    setQueryText('');
    Keyboard.dismiss();

    setLoading(true);
    setError(null);
    setPlaylist(null);
    setTrackMatches(null);
    setMatchingInProgress(false);
    setModalVisible(true);

    try {
      if (mode.key === 'create') {
        // 1) Composite prompt for LLM
        const compositePrompt = await buildCompositePrompt(userQuery);

        // 2) Ask Groq to generate a playlist
        const response = await GroqService.generatePlaylist({
          prompt: compositePrompt,
          preferences: { maxTracks: 30, explicit: true, energy: 'medium' },
        });

        if (response.success && response.data) {
          setPlaylist(response.data);
          setLoading(false);

          // 3) Attempt track matching
          if (tokens?.access_token) {
            setMatchingInProgress(true);
            try {
              const matchingResponse = await TrackMatchingService.matchTracks({
                suggestedTracks: response.data.tracks,
                accessToken: tokens.access_token,
                options: { maxResults: 5, minConfidence: 60, includeAlternatives: true },
              });

              if (matchingResponse.success) {
                setTrackMatches(matchingResponse);
              } else {
                setError(`Playlist generated, but track matching failed: ${matchingResponse.error}`);
              }
            } catch {
              setError('Playlist generated, but failed to find tracks on Spotify');
            } finally {
              setMatchingInProgress(false);
            }
          } else {
            setError('Playlist generated, but please login to Spotify to find actual tracks');
          }
        } else {
          setError(response.error || 'Failed to generate playlist');
        }
      } else {
        // Stub for other modes (they still benefit from system prompts now)
        setLoading(false);
        setError('This mode is not implemented yet.');
      }
    } catch {
      setError('Failed to process request. Please try again.');
    } finally {
      setLoading(false);
      setMatchingInProgress(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setPlaylist(null);
    setTrackMatches(null);
    setError(null);
    setMatchingInProgress(false);
  };

  // Renders correct params for the current mode
  const renderParamsCard = () => {
    const rows = [];

    // Row: Include system prompts (for all modes)
    rows.push(
      <ParamRow
        key="sys"
        label="Include system prompts"
        checked={includeSystem}
        onToggle={() => setIncludeSystem(v => !v)}
        onEdit={() => Alert.alert('Edit', 'Open System Prompts editor')}
        iconColor={iconColor}
        textColor={borderColor}
        backgroundColor={backgroundColor}
      />
    );

    // Extra rows only for "create"
    if (mode.key === 'create') {
      rows.push(
        <ParamRow
          key="tastes"
          label="Include tastes"
          checked={includeTastes}
          onToggle={() => setIncludeTastes(v => !v)}
          onEdit={() => Alert.alert('Edit', 'Open Tastes manager')}
          iconColor={iconColor}
          textColor={borderColor}
          backgroundColor={backgroundColor}
        />,
        <ParamRow
          key="discog"
          label="Include discography"
          checked={includeDiscog}
          onToggle={() => setIncludeDiscog(v => !v)}
          onEdit={() => Alert.alert('Edit', 'Open Discog settings')}
          iconColor={iconColor}
          textColor={borderColor}
          backgroundColor={backgroundColor}
        />
      );
    }

    return (
      <View style={[styles.paramsCard, { borderColor: iconColor + '33', backgroundColor }]}>
        {rows}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { position: 'relative' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Query box */}
      <View style={[styles.queryContainer, { borderColor, backgroundColor }]}>
        <View style={styles.leftCol}>
          <TextInput
            style={[styles.queryInput, { color: borderColor }]}
            placeholder="Ask me anything..."
            placeholderTextColor={placeholderColor}
            value={queryText}
            onChangeText={setQueryText}
            onSubmitEditing={handleQuerySubmit}
            multiline
            numberOfLines={3}
          />

          {/* Mode dropdown (button) */}
          <View style={styles.dropdownWrap}>
            <Pressable
              onPress={() => setShowDropdown(s => !s)}
              onLayout={e =>
                setDropdownBtnLayout({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
              style={[styles.dropdownButton, { borderColor: iconColor + '33', backgroundColor }]}
            >
              <Ionicons name={mode.icon} size={16} color={iconColor} />
              <Text style={[styles.dropdownLabel, { color: borderColor }]} numberOfLines={1}>
                {mode.label}
              </Text>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={iconColor} />
            </Pressable>

            {/* Floating dropdown list (absolute) */}
            {showDropdown && (
              <View
                style={[
                  styles.dropdownList,
                  {
                    backgroundColor,
                    borderColor: iconColor + '33',
                    top: (dropdownBtnLayout?.height ?? 36) + 6,
                    width: 220, // fixed width
                  },
                ]}
              >
                {MODES.map(m => (
                  <Pressable key={m.key} onPress={() => handleSelectMode(m)} style={styles.dropdownItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={m.icon} size={16} color={iconColor} />
                      <Text style={{ color: borderColor, fontSize: 13, fontWeight: '500' }}>
                        {m.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleQuerySubmit}>
          <Ionicons name="paper-plane" size={20} color={borderColor} />
        </TouchableOpacity>
      </View>

      {/* Tap-outside overlay to close dropdown */}
      {showDropdown && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { zIndex: 15 }]}
          onPress={() => setShowDropdown(false)}
        />
      )}

      {/* Params card BELOW (separate) */}
      {renderParamsCard()}

      {/* Results modal */}
      <QueryModal
        visible={modalVisible}
        onClose={handleCloseModal}
        playlist={playlist}
        loading={loading}
        error={error || undefined}
        query={lastQuery}
        trackMatches={trackMatches}
        matchingInProgress={matchingInProgress}
      />

      {/* Keyboard toolbar */}
      <KeyboardToolbar
        visible={isKeyboardVisible}
        onDone={() => setQueryText('')}
        onVoiceActivation={handleVoiceActivation}
        onLoopbackListening={handleLoopbackListening}
        onAddMedia={handleAddMedia}
      />
    </KeyboardAvoidingView>
  );
}

/* ---------- Small helpers ---------- */

function ParamRow({
  label,
  checked,
  onToggle,
  onEdit,
  iconColor,
  textColor,
  backgroundColor,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onEdit: () => void;
  iconColor: string;
  textColor: string;
  backgroundColor: string;
}) {
  return (
    <View style={styles.paramRow}>
      <Pressable style={styles.paramLeft} onPress={onToggle}>
        <Ionicons
          name={checked ? 'checkbox-outline' : 'square-outline'}
          size={18}
          color={textColor}
        />
        <Text style={[styles.paramLabel, { color: textColor }]}>{label}</Text>
      </Pressable>

      <TouchableOpacity
        onPress={onEdit}
        style={[styles.paramEditBtn, { borderColor: iconColor + '33', backgroundColor }]}
      >
        <Ionicons name="create-outline" size={14} color={textColor} />
        <Text style={[styles.paramEditText, { color: textColor }]}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  root: {
    width: '110%',
    marginTop: -340,
    marginRight: '-5.75%',
  },

  // Query
  queryContainer: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 15,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 50,
  },
  leftCol: {
    flex: 1,
    marginRight: 10,
  },
  queryInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown
  dropdownWrap: {
    marginTop: 8,
    alignSelf: 'flex-start',
    position: 'relative', // anchor for absolute list
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    zIndex: 60,     // iOS
    elevation: 20,  // Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Params card BELOW
  paramsCard: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paramLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  paramEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  paramEditText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
