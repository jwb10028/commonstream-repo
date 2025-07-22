
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity, Dimensions, PanResponder, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

// Node type for graph
type NodeType = 'track' | 'artist' | 'genre' | 'general';
interface Node {
  id: string;
  type: NodeType;
  label: string;
  edges: string[];
}

// User query mock (can be replaced with prop or state)
const userQuery = { type: 'artist', label: 'User Artist Query' };

// Generate 30 sub nodes, with the first node as the focused node labeled '...'
const NUM_UI_NODES = 30;
const subNodes: Node[] = [
  {
    id: 'subnode1',
    type: 'track',
    label: '...',
    edges: [],
  },
  ...Array.from({ length: NUM_UI_NODES - 1 }, (_, i) => ({
    id: `subnode${i + 2}`,
    type: 'general' as NodeType,
    label: '',
    edges: [],
  }))
];

// Primary node
const primaryNode: Node = {
  id: 'primary',
  type: userQuery.type as NodeType,
  label: userQuery.label,
  edges: subNodes.map(n => n.id),
};

const NODE_SIZE = 80;
const EDGE_COLOR = '#ccc';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ConnectScreen() {
  // Modal for select bar tabs
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists' | 'genres'>('tracks');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Sphere rotation: phi (vertical), theta (horizontal)
  const [rotation, setRotation] = useState({ phi: 0, theta: 0 });
  const [focusedIdx, setFocusedIdx] = useState(0);
  // Subnodes state (populated from ConnectAPI)
  const [nodes, setNodes] = useState<Node[]>(subNodes);

  // Handler for selection from modal
  const handleSelectBarItem = async (type: 'artist' | 'track' | 'genre', value: any) => {
    setSelectModalVisible(false);
    try {
      const { ConnectService } = require('@/services/ConnectAPI');
      let query;
      if (type === 'track' && typeof value === 'object') {
        query = { type, value: {
          name: value.name,
          artists: value.artists?.map((a: any) => a.name),
          album: value.album?.name,
          album_images: value.album?.images,
          id: value.id,
          external_urls: value.external_urls,
        }};
      } else if (type === 'artist' && typeof value === 'object') {
        query = { type, value: {
          name: value.name,
          genres: value.genres,
          id: value.id,
          images: value.images,
          external_urls: value.external_urls,
        }};
      } else {
        query = { type, value };
      }

      // Incremental batching logic
      const allNodes: any[] = [];
      const seenTitles = new Set<string>();
      let errorMsg = '';
      let attempts = 0;
      const maxAttempts = 10;
      let shouldStop = false;
      while (allNodes.length < NUM_UI_NODES && attempts < maxAttempts && !shouldStop) {
        const result = await ConnectService.getNodes(query);
        attempts++;
        if (!result.success || !result.data || !result.data.nodes) {
          errorMsg = result.error || `Batch failed`;
          shouldStop = true;
          break;
        }
        for (const n of result.data.nodes) {
          if (allNodes.length >= NUM_UI_NODES) break;
          if (!seenTitles.has(n.title)) {
            allNodes.push(n);
            seenTitles.add(n.title);
          }
        }
        const realNodes = allNodes.map((n: any, i: number) => ({
          ...n,
          id: `subnode${i + 1}`,
          type: type,
          label: n.title || n.label || `Node ${i + 1}`,
          edges: [],
        }));
        const emptyCount = NUM_UI_NODES - realNodes.length;
        const emptyNodes = Array.from({ length: emptyCount }, (_, i) => ({
          id: `subnode${realNodes.length + i + 1}`,
          type: 'general',
          label: '',
          edges: [],
        }));
        const allDisplayNodes = [...realNodes, ...emptyNodes];
        for (let i = allDisplayNodes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allDisplayNodes[i], allDisplayNodes[j]] = [allDisplayNodes[j], allDisplayNodes[i]];
        }
        setNodes([...allDisplayNodes]);
        const firstNonGeneralIdx = allDisplayNodes.findIndex(n => n.type !== 'general');
        setFocusedIdx(firstNonGeneralIdx >= 0 ? firstNonGeneralIdx : 0);
        setRotation({ phi: 0, theta: 0 });
      }
      if (allNodes.length < NUM_UI_NODES) {
        console.error('ConnectAPI error or not enough unique nodes:', errorMsg || `Only received ${allNodes.length} nodes`);
      }
    } catch (err) {
      console.error('ConnectAPI error:', err);
    }
  };

  // Spotify API logic for select modal
  const { tokens } = require('@/hooks/useSpotifyAuth').useSpotifyAuth();
  const spotifyApi = require('@/services/SpotifyAPI').spotifyApi;
  const [artists, setArtists] = useState<any[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [artistsError, setArtistsError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [genresError, setGenresError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchArtists = async () => {
      if (activeTab === 'artists' && tokens?.access_token) {
        setLoadingArtists(true);
        setArtistsError(null);
        try {
          const data = await spotifyApi.getUserTopArtists(tokens.access_token, 'medium_term', 20);
          setArtists(data.items || []);
        } catch (err: any) {
          setArtistsError(err.message || 'Failed to fetch artists');
        } finally {
          setLoadingArtists(false);
        }
      }
    };
    const fetchTracks = async () => {
      if (activeTab === 'tracks' && tokens?.access_token) {
        setLoadingTracks(true);
        setTracksError(null);
        try {
          const data = await spotifyApi.getUserTopTracks(tokens.access_token, 'medium_term', 20);
          setTracks(data.items || []);
        } catch (err: any) {
          setTracksError(err.message || 'Failed to fetch tracks');
        } finally {
          setLoadingTracks(false);
        }
      }
    };
    const fetchGenres = async () => {
      if (activeTab === 'genres' && tokens?.access_token) {
        setLoadingGenres(true);
        setGenresError(null);
        try {
          // Get genres from top artists
          const data = await spotifyApi.getUserTopArtists(tokens.access_token, 'medium_term', 20);
          const genreSet = new Set<string>();
          (data.items || []).forEach((artist: any) => {
            (artist.genres || []).forEach((g: string) => genreSet.add(g));
          });
          setGenres(Array.from(genreSet));
        } catch (err: any) {
          setGenresError(err.message || 'Failed to fetch genres');
        } finally {
          setLoadingGenres(false);
        }
      }
    };
    fetchArtists();
    fetchTracks();
    fetchGenres();
  }, [activeTab, tokens]);

  // PanResponder for sphere rotation
  const lastRotation = useRef({ phi: 0, theta: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastRotation.current = { ...rotation };
      },
      onPanResponderMove: (_, gestureState) => {
        setRotation({
          phi: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, lastRotation.current.phi + gestureState.dy * 0.01)),
          theta: lastRotation.current.theta + gestureState.dx * 0.01,
        });
      },
      onPanResponderRelease: () => {
        // Do nothing on release; focused node only changes on tap
      },
    })
  ).current;

  // Open modal for node
  const handleNodePress = (node: Node, idx?: number) => {
    setSelectedNode(node);
    setModalVisible(true);
    if (typeof idx === 'number') {
      setFocusedIdx(idx);
      setRotation({ phi: rotation.phi, theta: -(idx / subNodes.length) * 2 * Math.PI });
    }
  };

  // Layout for true sphere effect
  const centerX = SCREEN_WIDTH / 2;
  // Center sphere vertically in graph area, but move it further down
  const GRAPH_HEIGHT = 340;
  const centerY = GRAPH_HEIGHT / 2 + 120;
  const NUM_NODES = NUM_UI_NODES;
  const RADIUS = 220;

  // Disperse nodes in latitude/longitude for sphere
  function getSphereCoords(idx: number, num: number, rot: { phi: number; theta: number }) {
    // Golden Section Spiral for even sphere distribution
    const offset = 2 / num;
    const y = idx * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = Math.acos(y); // latitude
    const theta = ((2 * Math.PI * idx) / ((1 + Math.sqrt(5)) / 2)) + rot.theta; // longitude
    // Apply user rotation
    const x3d = r * Math.cos(theta);
    const y3d = y;
    const z3d = r * Math.sin(theta);
    // Rotate around vertical axis (phi)
    const cosPhi = Math.cos(rot.phi);
    const sinPhi = Math.sin(rot.phi);
    const xRot = x3d * cosPhi - y3d * sinPhi;
    const yRot = x3d * sinPhi + y3d * cosPhi;
    // Project to 2D
    const x2d = centerX + RADIUS * xRot - NODE_SIZE / 2;
    const y2d = centerY + RADIUS * yRot - NODE_SIZE / 2;
    // Depth for scale/opacity
    const depth = (z3d + 1) / 2;
    return { x: x2d, y: y2d, depth };
  }

  const windowHeight = Dimensions.get('window').height;
  return (
    <ThemedView style={[styles.container, { backgroundColor }] }>
      <View style={styles.centered}>
        {/* Bar select button above nodes */}
        <View style={{ width: SCREEN_WIDTH, alignItems: 'center', marginBottom: -72, marginTop: 8, zIndex: 10000, position: 'relative' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              paddingVertical: 15,
              paddingHorizontal: 30,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 0,
              marginBottom: 20,
              borderWidth: 1,
              width: SCREEN_WIDTH * 0.94,
              backgroundColor: backgroundColor === '#fff' ? 'white' : '#3A3A3A',
              borderColor: Colors.light.icon + '33',
              shadowColor: Colors.light.icon,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => setSelectModalVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color={textColor} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>
              Select Bar
            </Text>
          </TouchableOpacity>
        </View>
        {/* Modal for select bar tabs */}
        <Modal
          visible={selectModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectModalVisible(false)}
        >
          <View style={styles.bottomModalOverlay}>
            <View style={[styles.bottomModalContent, {
              height: windowHeight * 0.75,
              backgroundColor: backgroundColor,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#222',
              borderColor: '#ddd',
            }] }>
              {/* Handle bar for closing modal */}
              <TouchableOpacity style={styles.handle} onPress={() => setSelectModalVisible(false)}>
                <View style={styles.handleBar} />
              </TouchableOpacity>
              <View style={{ height: 36 }} />
              {/* Tab bar */}
              <View style={styles.tabBar}>
                {['artists', 'tracks', 'genres'].map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabBtn, activeTab === tab ? styles.tabBtnActive : null]}
                    onPress={() => setActiveTab(tab as 'tracks' | 'artists' | 'genres')}
                  >
                    <Text style={{ fontWeight: activeTab === tab ? 'bold' : 'normal', fontSize: 16, color: textColor }}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Tab content: show lists from Spotify, just like LibraryScreen */}
              <View style={{ marginTop: 18, minHeight: 120, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                {activeTab === 'tracks' && (
                  loadingTracks ? (
                    <Text style={{ color: textColor }}>Loading tracks...</Text>
                  ) : tracksError ? (
                    <Text style={{ color: 'red' }}>{tracksError}</Text>
                  ) : tracks.length === 0 ? (
                    <Text style={{ color: textColor }}>No top tracks found.</Text>
                  ) : (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
                      {tracks.map((track: any) => (
                        <TouchableOpacity
                          key={track.id}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                        onPress={() => handleSelectBarItem('track', track)}
                        >
                          {track.album?.images && track.album.images[0]?.url ? (
                            <View style={{ marginRight: 14 }}>
                              <Image
                                source={{ uri: track.album.images[0].url }}
                                style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee' }}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <Ionicons name="musical-notes" size={32} color={textColor} style={{ marginRight: 14 }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{track.name}</Text>
                            <Text style={{ color: Colors.light.icon, fontSize: 13 }}>{track.artists?.map((a: any) => a.name).join(', ') || 'Track'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={textColor} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )
                )}
                {activeTab === 'artists' && (
                  loadingArtists ? (
                    <Text style={{ color: textColor }}>Loading artists...</Text>
                  ) : artistsError ? (
                    <Text style={{ color: 'red' }}>{artistsError}</Text>
                  ) : artists.length === 0 ? (
                    <Text style={{ color: textColor }}>No top artists found.</Text>
                  ) : (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
                      {artists.map((artist: any) => (
                        <TouchableOpacity
                          key={artist.id}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                        onPress={() => handleSelectBarItem('artist', artist)}
                        >
                          {artist.images && artist.images[0]?.url ? (
                            <View style={{ marginRight: 14 }}>
                              <Image
                                source={{ uri: artist.images[0].url }}
                                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' }}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <Ionicons name="person" size={32} color={textColor} style={{ marginRight: 14 }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{artist.name}</Text>
                            <Text style={{ color: Colors.light.icon, fontSize: 13 }}>{artist.genres?.join(', ') || 'Artist'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={textColor} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )
                )}
                {activeTab === 'genres' && (
                  loadingGenres ? (
                    <Text style={{ color: textColor }}>Loading genres...</Text>
                  ) : genresError ? (
                    <Text style={{ color: 'red' }}>{genresError}</Text>
                  ) : genres.length === 0 ? (
                    <Text style={{ color: textColor }}>No genres found.</Text>
                  ) : (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }}>
                      {genres.map((genre: string) => (
                        <TouchableOpacity
                          key={genre}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                          onPress={() => handleSelectBarItem('genre', genre)}
                        >
                          <Ionicons name="pricetag" size={32} color={textColor} style={{ marginRight: 14 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{genre}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={textColor} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )
                )}
              </View>
            </View>
          </View>
        </Modal>
        {/* Only render subnodes in sphere */}
        <View style={styles.graphArea} {...panResponder.panHandlers}>
          {nodes.map((node, idx) => {
            // Get sphere coordinates
            const { x, y, depth } = getSphereCoords(idx, NUM_NODES, rotation);
            const isFocused = idx === focusedIdx;
            const scale = isFocused ? 3.0 : 0.6 + 0.4 * depth;
            let opacity = isFocused ? 1 : 0.12 + 0.24 * depth;
            if (node.type === 'general') opacity = 0.5;
            // For all nodes, use calculated x/y from getSphereCoords
            // For focused node, override x/y so it is exactly at center
            // Offset focused node: 1% right, 30% down from center
            const nodeLeft = isFocused
              ? centerX + SCREEN_WIDTH * 0.1825 - (NODE_SIZE * scale) / 2
              : x - SCREEN_WIDTH * 0.05;
            const nodeTop = isFocused
              ? centerY + GRAPH_HEIGHT * 0.4 - (NODE_SIZE * scale) / 2
              : y + GRAPH_HEIGHT * 0.3;
            return (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.node,
                  styles.subNode,
                  {
                    left: nodeLeft,
                    top: nodeTop,
                    backgroundColor: backgroundColor,
                    transform: [{ scale }],
                    opacity,
                    zIndex: isFocused ? 999 : Math.round(depth * 100),
                    position: 'absolute',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    shadowColor: Colors.light.icon,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    elevation: 6,
                    paddingHorizontal: isFocused ? 12 : 8,
                    paddingVertical: isFocused ? 10 : 6,
                  },
                ]}
                onPress={() => {
                  if (isFocused) {
                    setSelectedNode(node);
                    setModalVisible(true);
                  } else {
                    setFocusedIdx(idx);
                    setRotation({ phi: rotation.phi, theta: -(idx / NUM_NODES) * 2 * Math.PI });
                  }
                }}
              >
                {isFocused ? (
                  <View style={{
                    width: NODE_SIZE * 0.9,
                    height: NODE_SIZE * 0.9,
                    borderRadius: (NODE_SIZE * 0.9) / 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: backgroundColor,
                    borderWidth: 0.0,
                    borderColor: Colors.light.icon,
                    shadowColor: Colors.light.icon,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.18,
                    shadowRadius: 5,
                    elevation: 6,
                    alignSelf: 'center',
                  }}>
                    {(node as any).cover_image ? (
                      <Image
                        source={{ uri: (node as any).cover_image }}
                        style={{
                          width: NODE_SIZE * 0.9,
                          height: NODE_SIZE * 0.9,
                          borderRadius: (NODE_SIZE * 0.9) / 2,
                          backgroundColor: '#eee',
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                ) : null}
                {/* Label overlays avatar for focused node, or is alone for others */}
                {!isFocused && (
                  <View style={{
                    position: 'relative',
                    width: '98%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    paddingHorizontal: 2,
                  }}>
                    <Text
                      style={{
                        color: textColor,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: 13,
                        width: '100%',
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {node.label}
                    </Text>
                  </View>
                )}
                {/* Subheading removed */}
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Modal for node info */}
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.bottomModalOverlay}>
            <View style={[styles.bottomModalContent, {
              height: windowHeight * 0.75,
              backgroundColor: backgroundColor,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#222',
              borderColor: '#ddd',
            }] }>
              {/* Handle bar for closing modal */}
              <TouchableOpacity style={styles.handle} onPress={() => setModalVisible(false)}>
                <View style={styles.handleBar} />
              </TouchableOpacity>
              <View style={{ height: 36 }} />
              {/* Node profile content */}
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 32 }}>
                {selectedNode ? (
                  <>
                    {/* Cover image */}
                    {(selectedNode as any).cover_image ? (
                      <Image
                        source={{ uri: (selectedNode as any).cover_image }}
                        style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 18, backgroundColor: '#eee' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="image-outline" size={80} color={Colors.light.icon} style={{ marginBottom: 18 }} />
                    )}
                    {/* Title */}
                    <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 6, color: textColor, textAlign: 'center' }}>
                      {(selectedNode as any).title || selectedNode.label || 'No Title'}
                    </Text>
                    {/* Date Range */}
                    <Text style={{ color: textColor, fontSize: 16, marginBottom: 10, fontWeight: '600' }}>
                      Date Range: {(selectedNode as any).date_range || 'N/A'}
                    </Text>
                    {/* Description */}
                    <View style={{ marginBottom: 16, width: '100%' }}>
                      <Text style={{ color: textColor, fontWeight: '600', fontSize: 16, marginBottom: 4 }}>Description</Text>
                      <Text style={{ color: textColor, fontSize: 15, textAlign: 'center' }}>
                        {(selectedNode as any).description || 'No description available.'}
                      </Text>
                    </View>
                    {/* Relevant Links */}
                    <View style={{ marginTop: 8, alignItems: 'center', width: '100%' }}>
                      <Text style={{ fontWeight: '600', color: textColor, marginBottom: 4 }}>Relevant Links</Text>
                      {(selectedNode as any).relevantLinks && Array.isArray((selectedNode as any).relevantLinks) && (selectedNode as any).relevantLinks.length > 0 ? (
                        (selectedNode as any).relevantLinks.map((link: any, idx: number) => (
                          <TouchableOpacity
                            key={link.url + idx}
                            onPress={() => {
                              // Open link in browser
                              if (link.url) {
                                // @ts-ignore
                                if (typeof window !== 'undefined' && window.open) {
                                  window.open(link.url, '_blank');
                                } else {
                                  // For React Native, use Linking
                                  const Linking = require('react-native').Linking;
                                  Linking.openURL(link.url);
                                }
                              }
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                          >
                            <Ionicons name="link" size={18} color={tintColor} style={{ marginRight: 6 }} />
                            <Text style={{ color: tintColor, textDecorationLine: 'underline', fontSize: 15 }}>{link.url}</Text>
                            {link.type && (
                              <Text style={{ color: Colors.light.icon, fontSize: 13, marginLeft: 8 }}>{link.type}</Text>
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={{ color: Colors.light.icon, fontSize: 15 }}>No links available.</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <Text style={{ color: textColor, fontSize: 16 }}>No node selected.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ThemedView>
  );
}

// styles
const styles = StyleSheet.create({
  handle: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 2,
    paddingHorizontal: 20,
    width: '100%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#bbb',
    borderRadius: 2,
    marginBottom: 2,
  },
  bottomModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bottomModalContent: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    minHeight: 260,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    borderColor: '#222',
  },
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  primaryNodeArea: {
    display: 'none',
  },
  primaryNodeOverlay: {
    position: 'absolute',
    zIndex: 1000,
    width: 220,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
    minWidth: 220,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  selectBarBtnInner: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  graphArea: {
    width: '100%',
    height: 340,
    position: 'relative',
    marginBottom: 20,
    overflow: 'visible',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 8,
  },
  subNode: {
    backgroundColor: '#eee',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 220,
    elevation: 5,
  },
  closeModalBtn: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
});
