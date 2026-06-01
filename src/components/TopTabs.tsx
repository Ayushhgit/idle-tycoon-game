import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabName } from '../types/game';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';
import { TabIcons } from '../constants/icons';

const ORDER: TabName[] = ['tap', 'business', 'stocks', 'property', 'luxury', 'casino', 'prestige'];

interface Props {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export function TopTabs({ activeTab, onTabPress }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, { x: number; w: number }>>({});

  useEffect(() => {
    const l = layouts.current[activeTab];
    if (l && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, l.x - 40), animated: true });
    }
  }, [activeTab]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {ORDER.map((key) => {
          const tab = TabIcons[key];
          const isActive = key === activeTab;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              onPress={() => onTabPress(key)}
              onLayout={(e) => {
                layouts.current[key] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
              }}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Ionicons
                name={isActive ? tab.active : tab.inactive}
                size={16}
                color={isActive ? Colors.accent.platinum : Colors.text.muted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: Hairline.soft,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(228,233,242,0.08)',
    borderColor: 'rgba(228,233,242,0.18)',
  },
  label: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  labelActive: { color: Colors.accent.platinum },
  underline: { height: 0 },
});
