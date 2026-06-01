import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '../store/gameStore';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/typography';
import { Hairline } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function SettingsModal({ visible, onClose }: Props) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete ALL your progress permanently. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: () => {
            resetGame();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#161D2E', '#0A0E18']}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          <View style={styles.handle} />
          <Text style={styles.title}>SETTINGS</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Section title="AUDIO">
              <SettingRow
                label="Sound Effects"
                emoji="🔊"
                value={settings.soundEnabled}
                onToggle={(v) => updateSettings({ soundEnabled: v })}
              />
              <SettingRow
                label="Background Music"
                emoji="🎵"
                value={settings.musicEnabled}
                onToggle={(v) => updateSettings({ musicEnabled: v })}
              />
            </Section>

            <Section title="GAMEPLAY">
              <SettingRow
                label="Vibration"
                emoji="📳"
                value={settings.vibrationEnabled}
                onToggle={(v) => updateSettings({ vibrationEnabled: v })}
              />
              <SettingRow
                label="Notifications"
                emoji="🔔"
                value={settings.notificationsEnabled}
                onToggle={(v) => updateSettings({ notificationsEnabled: v })}
              />
            </Section>

            <Section title="GRAPHICS">
              <View style={styles.qualityRow}>
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => updateSettings({ graphicsQuality: q })}
                    style={[
                      styles.qualityBtn,
                      settings.graphicsQuality === q && styles.qualityBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        settings.graphicsQuality === q && styles.qualityTextActive,
                      ]}
                    >
                      {q.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="DANGER ZONE">
              <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                <LinearGradient
                  colors={[Colors.accent.red, Colors.accent.redDark]}
                  style={styles.resetGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.resetText}>RESET ALL PROGRESS</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Section>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.content}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  emoji,
  value,
  onToggle,
}: {
  label: string;
  emoji: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.emoji}>{emoji}</Text>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: Colors.accent.green + '80' }}
        thumbColor={value ? Colors.accent.green : '#666'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.text.primary,
    fontFamily: Fonts.displayBlack,
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 20,
  },
  qualityRow: { flexDirection: 'row', gap: 10 },
  qualityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  qualityBtnActive: {
    backgroundColor: 'rgba(91,141,239,0.22)',
    borderWidth: 1,
    borderColor: Colors.accent.blue,
  },
  qualityText: { color: Colors.text.muted, fontFamily: Fonts.bodyBold, fontSize: 13 },
  qualityTextActive: { color: Colors.accent.blueLight },
  resetBtn: { borderRadius: 14, overflow: 'hidden' },
  resetGrad: { paddingVertical: 14, alignItems: 'center' },
  resetText: { color: '#fff', fontFamily: Fonts.displaySemi, fontSize: 14, letterSpacing: 0.5 },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    alignItems: 'center',
  },
  closeText: { color: Colors.text.secondary, fontFamily: Fonts.bodyBold, fontSize: 14, letterSpacing: 1 },
});

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: {
    color: Colors.text.muted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
  },
  content: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  emoji: { fontSize: 20, marginRight: 12 },
  label: { flex: 1, color: Colors.text.primary, fontFamily: Fonts.bodySemi, fontSize: 15 },
});
