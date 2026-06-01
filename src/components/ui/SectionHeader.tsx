import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/typography';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Props {
  icon: IoniconName;
  title: string;
  trailing?: string;
  accent?: string;
}

/** Premium section header: accent chip + display title + thin gradient rule. */
export function SectionHeader({ icon, title, trailing, accent = Colors.accent.platinum }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.chip, { backgroundColor: accent + '1F', borderColor: accent + '3A' }]}>
          <Ionicons name={icon} size={15} color={accent} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        {trailing ? <Text style={[styles.trailing, { color: accent }]}>{trailing}</Text> : null}
      </View>
      <LinearGradient
        colors={[accent + '4D', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text.primary,
    fontFamily: Fonts.displaySemi,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  spacer: { flex: 1 },
  trailing: { fontFamily: Fonts.monoSemi, fontSize: 12, letterSpacing: 0.2 },
  rule: { height: 1, borderRadius: 1, marginTop: 10, opacity: 0.9 },
});
