import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useGameStore } from '../src/store/gameStore';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { useOfflineEarnings } from '../src/hooks/useOfflineEarnings';
import { useAchievements } from '../src/hooks/useAchievements';
import { useHaptics } from '../src/hooks/useHaptics';

import { MoneyDisplay } from '../src/components/MoneyDisplay';
import { TapButton } from '../src/components/TapButton';
import { TabBar } from '../src/components/TabBar';
import { Confetti } from '../src/components/Confetti';
import { DailyRewardModal } from '../src/components/DailyRewardModal';
import { OfflineEarningsModal } from '../src/components/OfflineEarningsModal';
import { SettingsModal } from '../src/components/SettingsModal';

import { BusinessScreen } from '../src/screens/BusinessScreen';
import { StockScreen } from '../src/screens/StockScreen';
import { PropertyScreen } from '../src/screens/PropertyScreen';
import { LuxuryScreen } from '../src/screens/LuxuryScreen';
import { PrestigeScreen } from '../src/screens/PrestigeScreen';
import { CasinoScreen } from '../src/screens/CasinoScreen';

import { Colors } from '../src/constants/colors';
import { TabName } from '../src/types/game';

export default function GameScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('tap');
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const loadSave = useGameStore((s) => s.loadSave);
  const achievements = useGameStore((s) => s.achievements);

  const { showOfflineModal, offlineEarnings, claimOfflineEarnings } = useOfflineEarnings();
  const { recentlyUnlocked } = useAchievements();
  const { achievementHaptic } = useHaptics();

  useGameLoop();

  useEffect(() => {
    loadSave().then(() => {
      const store = useGameStore.getState();
      const today = new Date().toDateString();
      if (
        store.dailyReward.pendingReward ||
        store.dailyReward.lastClaimedDate !== today
      ) {
        setTimeout(() => setShowDailyReward(true), 1200);
      }
    });
  }, []);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (recentlyUnlocked.length > 0) {
      const ach = achievements.find((a) => a.id === recentlyUnlocked[0]);
      if (ach) {
        achievementHaptic();
        setAchievementToast(`${ach.emoji} ${ach.name}`);
        setConfettiTrigger((c) => c + 1);
        // Own timer, NOT tied to effect cleanup. Previously the cleanup ran when
        // recentlyUnlocked reset to [] and cancelled the dismiss timer, so the
        // toast got stuck on screen forever.
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setAchievementToast(null), 3000);
      }
    }
  }, [recentlyUnlocked]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessScreen />;
      case 'stocks':
        return <StockScreen />;
      case 'property':
        return <PropertyScreen />;
      case 'luxury':
        return <LuxuryScreen />;
      case 'casino':
        return <CasinoScreen />;
      case 'prestige':
        return <PrestigeScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['#0c0c22', '#080816', '#05050e']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <MoneyDisplay onOpenSettings={() => setShowSettings(true)} />

      <View style={styles.content}>
        {activeTab === 'tap' ? (
          <TapButton />
        ) : (
          <Animated.View style={styles.screenWrapper} entering={FadeIn.duration(200)}>
            {renderTabContent()}
          </Animated.View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
        <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </SafeAreaView>

      {achievementToast !== null && (
        <Animated.View
          style={styles.achievementToast}
          entering={SlideInDown.duration(400)}
          exiting={FadeOut.duration(400)}
        >
          <LinearGradient
            colors={[Colors.accent.gold, Colors.accent.goldDark]}
            style={styles.toastGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.toastText}>🏆 UNLOCKED: {achievementToast}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <DailyRewardModal visible={showDailyReward} onClose={() => setShowDailyReward(false)} />
      <OfflineEarningsModal
        visible={showOfflineModal}
        amount={offlineEarnings}
        onClaim={claimOfflineEarnings}
      />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      <Confetti trigger={confettiTrigger} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080818',
  },
  content: { flex: 1 },
  screenWrapper: { flex: 1 },
  tabSafe: { backgroundColor: 'transparent' },
  achievementToast: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
  },
  toastGrad: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toastText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
