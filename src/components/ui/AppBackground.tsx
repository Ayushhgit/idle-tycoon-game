import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

/**
 * Atmospheric backdrop for the whole app: a deep blue-black base with two
 * soft elliptical "spotlights" (faked radials) and a hairline vignette.
 * Gives depth instead of a flat fill. Render once behind everything.
 */
export function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#0C111E', '#0B0F1A', '#080B14']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* cool platinum spotlight, upper area */}
      <View style={styles.glowTop}>
        <LinearGradient
          colors={['rgba(91,141,239,0.16)', 'rgba(91,141,239,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* faint warm champagne glow, lower right */}
      <View style={styles.glowBottom}>
        <LinearGradient
          colors={['rgba(205,167,101,0.10)', 'rgba(205,167,101,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const SIZE = W * 1.6;

const styles = StyleSheet.create({
  glowTop: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    top: -SIZE * 0.62,
    left: -SIZE * 0.18,
    opacity: 0.9,
  },
  glowBottom: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    bottom: -SIZE * 0.66,
    right: -SIZE * 0.3,
    opacity: 0.8,
  },
});
