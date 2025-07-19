
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
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

// Generate 50 sub nodes
const subNodes: Node[] = Array.from({ length: 50 }, (_, i) => ({
  id: `subnode${i + 1}`,
  type: 'general',
  label: `Node ${i + 1}`,
  edges: [],
}));

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
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Sphere rotation: phi (vertical), theta (horizontal)
  const [rotation, setRotation] = useState({ phi: 0, theta: 0 });
  const [focusedIdx, setFocusedIdx] = useState(0);

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
      onPanResponderRelease: (_, gestureState) => {
        // Snap to nearest node horizontally
        const NUM_NODES = subNodes.length;
        const theta = lastRotation.current.theta + gestureState.dx * 0.01;
        let idx = Math.round((-theta / (2 * Math.PI)) * NUM_NODES) % NUM_NODES;
        if (idx < 0) idx += NUM_NODES;
        setFocusedIdx(idx);
        setRotation({ phi: rotation.phi, theta: -(idx / NUM_NODES) * 2 * Math.PI });
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
  const NUM_NODES = subNodes.length;
const RADIUS = 260;

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

  return (
    <ThemedView style={[styles.container, { backgroundColor }] }>
      <View style={styles.centered}>
        {/* Bar select button above nodes */}
        <View style={{ width: SCREEN_WIDTH, alignItems: 'center', marginBottom: -72, marginTop: 8 }}>
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
            onPress={() => alert('Select Bar Button Pressed')}
          >
            <Ionicons name="options-outline" size={20} color={textColor} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>
              Select Bar
            </Text>
          </TouchableOpacity>
        </View>
        {/* Only render subnodes in sphere */}
        <View style={styles.graphArea} {...panResponder.panHandlers}>
          {subNodes.map((node, idx) => {
            // Get sphere coordinates
            const { x, y, depth } = getSphereCoords(idx, NUM_NODES, rotation);
            const isFocused = idx === focusedIdx;
            const scale = isFocused ? 2.5 : 0.6 + 0.4 * depth;
            const opacity = isFocused ? 1 : 0.12 + 0.24 * depth;
            // For all nodes, use calculated x/y from getSphereCoords
            // For focused node, override x/y so it is exactly at center
            // Offset focused node: 1% right, 30% down from center
            const nodeLeft = isFocused
              ? centerX + SCREEN_WIDTH * 0.13 - (NODE_SIZE * scale) / 2
              : x - SCREEN_WIDTH * 0.05;
            const nodeTop = isFocused
              ? centerY + GRAPH_HEIGHT * 0.3 - (NODE_SIZE * scale) / 2
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
                  },
                ]}
                onPress={() => {
                  if (isFocused) {
                    // Open modal for focused node
                    setSelectedNode(node);
                    setModalVisible(true);
                  } else {
                    // Switch focus to this node
                    setFocusedIdx(idx);
                    setRotation({ phi: rotation.phi, theta: -(idx / NUM_NODES) * 2 * Math.PI });
                  }
                }}
              >
                <Text style={{ color: textColor, fontWeight: 'bold', textAlign: 'center' }}>{node.label}</Text>
                <Text style={{ color: textColor, fontSize: 12 }}>{node.type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Modal for node info */}
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>{selectedNode?.label}</Text>
              <Text style={{ marginBottom: 12 }}>{selectedNode?.type}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={{ color: tintColor, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ThemedView>
  );
}

// styles
const styles = StyleSheet.create({
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
