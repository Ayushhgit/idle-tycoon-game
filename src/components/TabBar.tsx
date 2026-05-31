import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TabName } from '../types/game';
import { Colors } from '../constants/colors';

interface Tab {
  key: TabName;
  label: string;
  emoji: string;
}

const TABS: Tab[] = [
  { key: 'tap',      label: 'TAP',    emoji: '👆' },
  { key: 'business', label: 'BIZ',    emoji: '🏢' },
  { key: 'stocks',   label: 'STOCK',  emoji: '📈' },
  { key: 'property', label: 'EST',    emoji: '🏠' },
  { key: 'luxury',   label: 'LUX',    emoji: '💎' },
  { key: 'casino',   label: 'CASINO', emoji: '🎰' },
  { key: 'prestige', label: 'ELITE',  emoji: '✨' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_MARGIN = 12;
const INNER_PAD = 6;
const BAR_WIDTH = SCREEN_WIDTH - SIDE_MARGIN * 2;
const TAB_WIDTH = (BAR_WIDTH - INNER_PAD * 2) / TABS.length;

interface Props {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export function TabBar({ activeTab, onTabPress }: Props) {
  const activeIdx = TABS.findIndex((t) => t.key === activeTab);
  const pillX = useSharedValue(activeIdx * TAB_WIDTH);

  React.useEffect(() => {
    pillX.value = withSpring(activeIdx * TAB_WIDTH, { damping: 16, stiffness: 200 });
  }, [activeIdx]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        <LinearGradient
          colors={['rgba(28,28,58,0.92)', 'rgba(14,14,32,0.96)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* sliding active pill */}
        <Animated.View style={[styles.pill, pillStyle, { width: TAB_WIDTH }]}>
          <LinearGradient
            colors={['rgba(255,215,0,0.20)', 'rgba(255,140,0,0.08)']}
            style={styles.pillGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>

        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tab, { width: TAB_WIDTH }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, isActive && styles.emojiActive]}>{tab.emoji}</Text>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 22,
    paddingHorizontal: INNER_PAD,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  pill: {
    position: 'absolute',
    left: INNER_PAD,
    top: 7,
    bottom: 7,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.30)',
  },
  pillGrad: { flex: 1 },
  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  emoji: { fontSize: 19, opacity: 0.42 },
  emojiActive: { opacity: 1 },
  label: {
    color: Colors.text.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelActive: { color: Colors.accent.gold },
});
