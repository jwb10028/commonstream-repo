import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function Glow() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // RGB color oscillation
    const colorOscillation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: false,
      })
    );

    colorOscillation.start();
  }, []);

  // Interpolate RGB values for color transitions
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [
      'rgba(255, 50, 50, 0.4)', // More saturated Red
      'rgba(50, 255, 50, 0.4)', // More saturated Green
      'rgba(50, 50, 255, 0.4)', // More saturated Blue
      'rgba(255, 50, 50, 0.4)', // Back to Red
    ],
  });

  return (
    <View style={styles.container}>
      {/* Main sphere with blur */}
      <BlurView intensity={80} style={styles.sphereBlurContainer}>
        <Animated.View
          style={[
            styles.sphere,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        />
      </BlurView>
      
      {/* Additional blur layers for enhanced soft glow */}
      <BlurView intensity={60} style={styles.blurLayer1Container}>
        <Animated.View
          style={[
            styles.blurLayer1,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        />
      </BlurView>
      
      <BlurView intensity={40} style={styles.blurLayer2Container}>
        <Animated.View
          style={[
            styles.blurLayer2,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        />
      </BlurView>
      
      {/* Blur overlay for soft edge falloff */}
      <BlurView intensity={20} style={styles.blurOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0, // Changed from -1 to 0 to prevent hiding behind content
    pointerEvents: 'none', // Allow touches to pass through
  },
  sphereBlurContainer: {
    position: 'absolute',
    width: Math.min(width, height) * 1.8,
    height: Math.min(width, height) * 1.8,
    borderRadius: (Math.min(width, height) * 1.8) / 2,
    overflow: 'hidden',
  },
  sphere: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (Math.min(width, height) * 1.8) / 2,
    opacity: 0.4,
  },
  blurLayer1Container: {
    position: 'absolute',
    width: Math.min(width, height) * 2.4,
    height: Math.min(width, height) * 2.4,
    borderRadius: (Math.min(width, height) * 2.4) / 2,
    overflow: 'hidden',
  },
  blurLayer1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (Math.min(width, height) * 2.4) / 2,
    opacity: 0.2,
  },
  blurLayer2Container: {
    position: 'absolute',
    width: Math.min(width, height) * 3.0,
    height: Math.min(width, height) * 3.0,
    borderRadius: (Math.min(width, height) * 3.0) / 2,
    overflow: 'hidden',
  },
  blurLayer2: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (Math.min(width, height) * 3.0) / 2,
    opacity: 0.1,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Moved blur overlay behind the glow layers
  },
});
