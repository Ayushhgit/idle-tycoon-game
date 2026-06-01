import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { formatDuration } from '../utils/formatters';
import { GameState } from '../types/game';

type BoosterKey = keyof GameState['boosters'];
type IoniconName = keyof typeof Ionicons.glyphMap;

interface BoosterDef {
  key: BoosterKey;
  name: string;
  description: string;
  icon: IoniconName;
  gemCost: number;
  colors: [string, string];
}

const BOOSTERS: BoosterDef[] = [
  {
    key: 'incomeBoost2x',
    name: '2x Income',
    description: 'Double passive income for 2 minutes',
    icon: 'flash',
    gemCost: 20,
    colors: ['#E6CD92', '#CDA765'],
  },
  {
    key: 'tapMultiplier3x',
    name: '3x Tap Power',
    description: 'Triple tap earnings for 90 seconds',
    icon: 'finger-print',
    gemCost: 15,
    colors: ['#5B8DEF', '#3D6FD6'],
  },
  {
    key: 'autoClicker',
    name: 'Auto Clicker',
    description: 'Auto-taps 1x/sec for 60 seconds',
    icon: 'hardware-chip',
    gemCost: 10,
    colors: ['#9D8CFF', '#6F5BD6'],
  },
  {
    key: 'investmentBoost',
    name: 'Investment Boost',
    description: '10% off stock purchases for 3 minutes',
    icon: 'trending-up',
    gemCost: 25,
    colors: ['#3DDC97', '#22B97E'],
  },
];

interface Props {
  boosters: GameState['boosters'];
  gems: number;
  onActivate: (key: BoosterKey) => void;
}

export function BoosterPanel({ boosters, gems, onActivate }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="flash" size={13} color={Colors.accent.gold} />
        <Text style={styles.sectionTitle}>BOOSTERS</Text>
      </View>
      {BOOSTERS.map((def) => {
        const state = boosters[def.key];
        const remaining = state.active ? Math.max(0, state.endsAt - Date.now()) : 0;
        const isActive = state.active && remaining > 0;
        const canAfford = gems >= def.gemCost;
        return (
          <BoosterCard
            key={def.key}
            def={def}
            isActive={isActive}
            remaining={remaining}
            canAfford={canAfford}
            onActivate={() => onActivate(def.key)}
          />
        );
      })}
    </View>
  );
}

const BoosterCard = memo(function BoosterCard({
  def,
  isActive,
  remaining,
  canAfford,
  onActivate,
}: {
  def: BoosterDef;
  isActive: boolean;
  remaining: number;
  canAfford: boolean;
  onActivate: () => void;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1
      );
    } else {
      pulse.value = 1;
    }
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
      <View style={[styles.card, isActive && styles.activeCard]}>
        {isActive && (
          <LinearGradient
            colors={[def.colors[0] + '20', 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          />
        )}
        <View style={[styles.iconArea, { backgroundColor: def.colors[0] + '22', borderColor: def.colors[0] + '3A' }]}>
          <Ionicons name={def.icon} size={22} color={def.colors[0]} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{def.name}</Text>
          <Text style={styles.description}>{def.description}</Text>
          {isActive && (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={12} color={def.colors[0]} />
              <Text style={[styles.timer, { color: def.colors[0] }]}>
                {formatDuration(remaining)} remaining
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onActivate}
          disabled={isActive || !canAfford}
          style={[styles.buyBtn, (isActive || !canAfford) && styles.buyBtnDisabled]}
        >
          <LinearGradient
            colors={isActive ? ['#1b2030', '#141925'] : canAfford ? def.colors : ['#1b2030', '#141925']}
            style={styles.buyGrad}
          >
            {isActive ? (
              <Text style={styles.activeText}>ACTIVE</Text>
            ) : (
              <>
                <Ionicons name="diamond" size={12} color="#0E1422" />
                <Text style={styles.gemCost}>{def.gemCost}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: Colors.text.secondary,
    fontFamily: Fonts.displaySemi,
    fontSize: 13,
    letterSpacing: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    marginVertical: 5,
    marginHorizontal: 16,
    padding: 12,
    overflow: 'hidden',
  },
  activeCard: {
    borderWidth: 1,
    borderColor: 'rgba(228,233,242,0.2)',
  },
  iconArea: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { color: Colors.text.primary, fontFamily: Fonts.displaySemi, fontSize: 14 },
  description: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, marginTop: 3 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  timer: { fontFamily: Fonts.monoSemi, fontSize: 12 },
  buyBtn: { borderRadius: 10, overflow: 'hidden' },
  buyBtnDisabled: { opacity: 0.5 },
  buyGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  gemEmoji: { fontSize: 13, color: '#0E1422' },
  gemCost: { color: '#0E1422', fontFamily: Fonts.monoSemi, fontSize: 14 },
  activeText: {
    color: Colors.accent.green,
    fontFamily: Fonts.bodyExtra,
    fontSize: 12,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
});
