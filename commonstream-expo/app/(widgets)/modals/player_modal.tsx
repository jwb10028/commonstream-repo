import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PlayerModalProps {
  visible: boolean;
  onClose: () => void;
  deviceList?: any; // Changed to optional to avoid TypeScript error if not provided
  tokens: { access_token: string };
  remoteApi: {
    remoteDeviceTransfer: (token: string, deviceId: string, play: boolean) => Promise<any>;
  };
}

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.75;

export default function PlayerModal({ visible, onClose, deviceList, tokens, remoteApi }: PlayerModalProps) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const [showModal, setShowModal] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(animatedHeight, {
        toValue: MODAL_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  // If deviceList is an array, use it directly; if it's an object, wrap in array
  let devices = Array.isArray(deviceList) ? deviceList : [deviceList];
  // Sort so active device is always at the top
  devices = devices.slice().sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));

  // Helper to render icon based on device type
  // Use Ionicons for device icons, matching home_modal
  const renderDeviceIcon = (type: string) => {
    if (type === 'Computer') {
      return (
        <View style={styles.deviceIconContainer}>
          <Ionicons name="desktop-outline" size={28} color={iconColor} />
        </View>
      );
    } else if (type === 'Smartphone') {
      return (
        <View style={styles.deviceIconContainer}>
          <Ionicons name="phone-portrait-outline" size={28} color={iconColor} />
        </View>
      );
    } else {
      return (
        <View style={styles.deviceIconContainer}>
          <Ionicons name="volume-high-outline" size={28} color={iconColor} />
        </View>
      );
    }
  };

  const handleDeviceTransfer = async (deviceId: string) => {
    if (tokens?.access_token && remoteApi?.remoteDeviceTransfer) {
      try {
        await remoteApi.remoteDeviceTransfer(tokens.access_token, deviceId, true);
        onClose(); // Optionally close modal after transfer
      } catch (error) {
        console.error("Device transfer failed:", error);
      }
    }
  };

  return (
    <Animated.View style={[styles.modal, { height: animatedHeight, backgroundColor }]}>
      {/* Handle bar */}
      <TouchableOpacity style={styles.handle} onPress={onClose}>
        <View style={[styles.handleBar, { backgroundColor: iconColor + '66' }]} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.headerText}>Devices</Text>
        <View style={styles.deviceListContainer}>
          {devices.map((device: any, idx: number) => (
            <TouchableOpacity
              key={device.id || idx}
              style={[styles.deviceBubble, device.is_active && styles.activeDevice]}
              onPress={() => handleDeviceTransfer(device.id)}
            >
              <View style={styles.deviceRow}>
                {renderDeviceIcon(device.type)}
                <View style={styles.deviceTextContainer}>
                  <Text style={[styles.deviceName, { color: textColor }]}>{device.name}</Text>
                  <Text style={[styles.deviceType, { color: iconColor }]}>{device.type}</Text>
                </View>
                {device.is_active ? (
                  <Text style={styles.activeLabel}>Active</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  deviceListContainer: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
    gap: 18,
    paddingBottom: 20,
  },
  deviceBubble: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 0,
  },
  activeDevice: {
    backgroundColor: '#D1FADF',
    borderColor: '#38B2AC',
    shadowColor: '#38B2AC',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  deviceIconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deviceTextContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    marginBottom: 2,
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38B2AC',
    marginLeft: 12,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
