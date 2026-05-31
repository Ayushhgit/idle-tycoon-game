import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface Props {
  label: string;
  value: string;
  icon?: string;
  accent?: string;
  style?: ViewStyle;
}

/** Premium glassy stat tile with an accent rail and soft gradient. */
export function StatTile({ label, value, icon, accent = Colors.accent.gold, style }: Props) {
  return (
    <View style={[styles.tile, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.015)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.rail, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    minHeight: 74,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  body: { paddingVertical: 12, paddingHorizontal: 14, justifyContent: 'center', flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  icon: { fontSize: 11 },
  label: {
    color: Colors.text.muted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  value: { fontWeight: '900', fontSize: 19 },
});
