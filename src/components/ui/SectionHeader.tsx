import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface Props {
  icon: string;
  title: string;
  trailing?: string;
  accent?: string;
}

/** Consistent premium section header: accent chip + title + thin gradient rule. */
export function SectionHeader({ icon, title, trailing, accent = Colors.accent.gold }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.chip, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
          <Text style={styles.chipIcon}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        {trailing ? <Text style={[styles.trailing, { color: accent }]}>{trailing}</Text> : null}
      </View>
      <LinearGradient
        colors={[accent + '55', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIcon: { fontSize: 14 },
  title: {
    color: Colors.text.primary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  spacer: { flex: 1 },
  trailing: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  rule: { height: 1.5, borderRadius: 1, marginTop: 9 },
});
