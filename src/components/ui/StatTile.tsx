import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';
import { Hairline } from '../../constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Props {
  label: string;
  value: string;
  icon?: IoniconName;
  accent?: string;
  style?: ViewStyle;
}

/** Glassy stat tile with an accent rail and mono figure. */
export function StatTile({ label, value, icon, accent = Colors.accent.platinum, style }: Props) {
  return (
    <View style={[styles.tile, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.012)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.rail, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {icon ? <Ionicons name={icon} size={11} color={accent} /> : null}
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
    borderColor: Hairline.soft,
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  icon: { fontSize: 11 },
  label: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  value: { fontFamily: Fonts.monoSemi, fontSize: 18, letterSpacing: -0.3 },
});
