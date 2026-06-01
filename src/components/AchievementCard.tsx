import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Achievement } from '../types/game';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { formatNumber } from '../utils/formatters';

interface Props {
  achievement: Achievement;
  isNew?: boolean;
}

export const AchievementCard = memo(function AchievementCard({ achievement, isNew }: Props) {
  const scale = useSharedValue(isNew ? 0.8 : 1);

  useEffect(() => {
    if (isNew) {
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [isNew]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const progressPct = Math.min(achievement.progress / achievement.target, 1);

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.card, achievement.unlocked && styles.unlockedCard]}>
        {achievement.unlocked && (
          <LinearGradient
            colors={['rgba(205,167,101,0.09)', 'rgba(205,167,101,0.02)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          />
        )}
        <View style={[styles.iconBg, achievement.unlocked && styles.iconBgUnlocked]}>
          <Text style={styles.emoji}>{achievement.emoji}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, !achievement.unlocked && styles.nameLocked]}>
              {achievement.name}
            </Text>
            {achievement.unlocked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.description}>{achievement.description}</Text>

          {!achievement.unlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
              </View>
              <Text style={styles.progressText}>
                {formatNumber(achievement.progress)} / {formatNumber(achievement.target)}
              </Text>
            </View>
          )}

          <View style={styles.rewardRow}>
            {achievement.reward.gems !== undefined && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>💎 {achievement.reward.gems}</Text>
              </View>
            )}
            {achievement.reward.incomeMultiplier !== undefined && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>
                  Income x{achievement.reward.incomeMultiplier.toFixed(2)}
                </Text>
              </View>
            )}
            {achievement.reward.tapMultiplier !== undefined && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>
                  Tap x{achievement.reward.tapMultiplier.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    marginVertical: 5,
    marginHorizontal: 16,
    padding: 14,
    opacity: 0.7,
    overflow: 'hidden',
  },
  unlockedCard: {
    opacity: 1,
    borderWidth: 1,
    borderColor: 'rgba(205,167,101,0.24)',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBgUnlocked: { backgroundColor: 'rgba(205,167,101,0.14)' },
  emoji: { fontSize: 26 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { color: Colors.text.primary, fontFamily: Fonts.displaySemi, fontSize: 14, flex: 1 },
  nameLocked: { color: Colors.text.muted },
  checkmark: { color: Colors.accent.gold, fontFamily: Fonts.bodyExtra, fontSize: 15 },
  description: { color: Colors.text.muted, fontFamily: Fonts.body, fontSize: 11, marginBottom: 6 },
  progressContainer: { marginBottom: 6 },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.gold,
    borderRadius: 2,
  },
  progressText: { color: Colors.text.muted, fontFamily: Fonts.mono, fontSize: 10 },
  rewardRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  rewardPill: {
    backgroundColor: 'rgba(205,167,101,0.1)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rewardText: { color: Colors.accent.gold, fontSize: 10, fontFamily: Fonts.bodySemi },
});
