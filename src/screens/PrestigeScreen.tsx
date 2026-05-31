import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../utils/formatters';
import { calcPrestigeTokens } from '../utils/calculations';
import { Colors } from '../constants/colors';
import { GameConfig } from '../constants/gameConfig';
import { useHaptics } from '../hooks/useHaptics';

const { width } = Dimensions.get('window');

export function PrestigeScreen() {
  const prestigeData = useGameStore((s) => s.prestigeData);
  const netWorth = useGameStore((s) => s.netWorth);
  const performPrestige = useGameStore((s) => s.performPrestige);
  const { achievementHaptic } = useHaptics();

  const canPrestige = netWorth >= GameConfig.prestige.minimumNetWorth;
  const tokens = canPrestige ? calcPrestigeTokens(netWorth, prestigeData.count) : 0;

  const glow = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
      -1
    );
    rotate.value = withRepeat(withTiming(360, { duration: 10000 }), -1, false);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const handlePrestige = () => {
    if (!canPrestige) return;
    Alert.alert(
      '✨ PRESTIGE',
      `Reset your progress for ${tokens} Prestige Tokens?\n\nYou keep: Achievements, Gems, Permanent bonuses.\n\nYour income multiplier and tap power increase permanently!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PRESTIGE!',
          onPress: () => {
            achievementHaptic();
            performPrestige();
          },
        },
      ]
    );
  };

  const currentTokens = prestigeData.tokens;
  const nextTapBoost = 1 + (currentTokens + tokens) * GameConfig.prestige.tapBoostPerToken;
  const nextIncomeBoost = 1 + (currentTokens + tokens) * GameConfig.prestige.incomeBoostPerToken;

  const PRESTIGE_PERKS = [
    {
      label: 'Tap Multiplier',
      current: `${prestigeData.permanentTapMultiplier.toFixed(2)}x`,
      after: `${nextTapBoost.toFixed(2)}x`,
      emoji: '👆',
      color: Colors.accent.gold,
    },
    {
      label: 'Income Multiplier',
      current: `${prestigeData.permanentIncomeMultiplier.toFixed(2)}x`,
      after: `${nextIncomeBoost.toFixed(2)}x`,
      emoji: '💰',
      color: Colors.accent.green,
    },
    {
      label: 'Stock Luck',
      current: `+${(prestigeData.permanentStockLuck * 100).toFixed(1)}%`,
      after: `+${((currentTokens + tokens) * GameConfig.prestige.stockLuckPerToken * 100).toFixed(1)}%`,
      emoji: '📈',
      color: Colors.accent.blue,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Animated.View style={[styles.glowOrb, glowStyle]} />
        <Animated.View style={[styles.spinRing, rotateStyle]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.orbDot,
                { transform: [{ rotate: `${i * 45}deg` }, { translateY: -80 }] },
              ]}
            />
          ))}
        </Animated.View>
        <Text style={styles.prestigeEmoji}>✨</Text>
        <Text style={styles.prestigeCount}>PRESTIGE {prestigeData.count}</Text>
        <Text style={styles.tokenCount}>💠 {prestigeData.tokens} Tokens</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT BONUSES</Text>
        {PRESTIGE_PERKS.map((perk) => (
          <View key={perk.label} style={styles.perkRow}>
            <Text style={styles.perkEmoji}>{perk.emoji}</Text>
            <Text style={styles.perkLabel}>{perk.label}</Text>
            <View style={styles.perkValues}>
              <Text style={[styles.perkCurrent, { color: perk.color }]}>{perk.current}</Text>
              {canPrestige && (
                <>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={[styles.perkAfter, { color: perk.color }]}>{perk.after}</Text>
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRESTIGE REQUIREMENTS</Text>
        <View style={styles.requireCard}>
          <LinearGradient
            colors={['rgba(255,109,0,0.1)', 'rgba(255,61,0,0.05)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <Text style={styles.reqLabel}>Minimum Net Worth Required</Text>
          <Text style={styles.reqValue}>{formatMoney(GameConfig.prestige.minimumNetWorth)}</Text>
          <Text style={styles.yourLabel}>Your Net Worth</Text>
          <Text style={[styles.yourValue, { color: canPrestige ? Colors.accent.green : Colors.accent.red }]}>
            {formatMoney(netWorth)}
          </Text>
          {canPrestige && (
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardLabel}>YOU WILL RECEIVE</Text>
              <Text style={styles.rewardValue}>💠 {tokens} Prestige Tokens</Text>
              <Text style={styles.rewardValue}>💎 {tokens * 10} Gems</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={handlePrestige}
        disabled={!canPrestige}
        style={[styles.prestigeBtn, !canPrestige && styles.prestigeBtnDisabled]}
      >
        <LinearGradient
          colors={canPrestige ? ['#FF6D00', '#FF3D00'] : ['#333', '#222']}
          style={styles.prestigeGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.prestigeBtnText}>
            {canPrestige
              ? `✨ PRESTIGE (+${tokens} tokens)`
              : `🔒 Need ${formatMoney(GameConfig.prestige.minimumNetWorth)} net worth`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {!canPrestige && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress: {Math.min(100, (netWorth / GameConfig.prestige.minimumNetWorth) * 100).toFixed(1)}%
          </Text>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={['#FF6D00', '#FF3D00']}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (netWorth / GameConfig.prestige.minimumNetWorth) * 100)}%` as any,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF6D00',
  },
  spinRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6D00',
  },
  prestigeEmoji: { fontSize: 60, zIndex: 10 },
  prestigeCount: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    zIndex: 10,
    marginTop: 8,
  },
  tokenCount: {
    color: Colors.accent.purple,
    fontSize: 16,
    fontWeight: '700',
    zIndex: 10,
    marginTop: 4,
  },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  perkEmoji: { fontSize: 22, marginRight: 12 },
  perkLabel: { flex: 1, color: Colors.text.secondary, fontWeight: '600', fontSize: 14 },
  perkValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkCurrent: { fontWeight: '800', fontSize: 15 },
  arrow: { color: Colors.text.muted, fontSize: 14 },
  perkAfter: { fontWeight: '900', fontSize: 15 },
  requireCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,109,0,0.2)',
  },
  reqLabel: { color: Colors.text.muted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  reqValue: { color: Colors.text.primary, fontWeight: '800', fontSize: 22, marginBottom: 12 },
  yourLabel: { color: Colors.text.muted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  yourValue: { fontWeight: '900', fontSize: 24, marginBottom: 12 },
  rewardPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  rewardLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  rewardValue: { color: Colors.accent.gold, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  prestigeBtn: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prestigeBtnDisabled: { opacity: 0.5 },
  prestigeGrad: { paddingVertical: 20, alignItems: 'center' },
  prestigeBtnText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  progressSection: { paddingHorizontal: 16, marginBottom: 20 },
  progressLabel: { color: Colors.text.muted, fontSize: 12, marginBottom: 8 },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
