import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Hairline, Shadow } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** hairline border tone */
  border?: keyof typeof Hairline | 'none';
  /** drop shadow tier */
  elevation?: keyof typeof Shadow | 'none';
  /** subtle top-light glass sheen */
  sheen?: boolean;
}

/**
 * Premium glass surface: layered translucent fill, hairline metal border and
 * an optional top sheen. The building block for every card in the app.
 */
export function Surface({
  children,
  style,
  radius = Radius.lg,
  border = 'soft',
  elevation = 'card',
  sheen = true,
}: Props) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius },
        border !== 'none' && { borderWidth: 1, borderColor: Hairline[border] },
        elevation !== 'none' && Shadow[elevation],
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.015)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {sheen && (
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={[styles.sheen, { borderRadius: radius }]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#121826',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
});
