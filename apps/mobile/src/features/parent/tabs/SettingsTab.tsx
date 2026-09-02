import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { RESET_CONFIRM_TEXT, RESET_DELETES_TEXT, RESET_KEEPS_TEXT } from '@/domain/parent/progressReset';
import { audioEngine } from '@/services/audio';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { BackupPanel } from '../components/BackupPanel';

const RATES = [
  { v: 0.6, label: 'איטי' },
  { v: 0.85, label: 'רגיל' },
  { v: 1, label: 'מהיר' },
] as const;
const VOLS = [
  { v: 0.25, label: 'שקט' },
  { v: 0.5, label: 'בינוני' },
  { v: 0.85, label: 'חזק' },
] as const;

const PRIVACY = 'https://yonicks.github.io/talki/privacy.html';

export function SettingsTab() {
  const { settings, patchSettings } = useSettingsStore();
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const [confirming, setConfirming] = useState(false);

  const toggle = (key: 'niqqud' | 'sounds' | 'effects' | 'music' | 'voice') => {
    const next = !settings[key];
    void patchSettings({ [key]: next });
    if (key === 'music') audioEngine.setMusicEnabled(next);
    if (key === 'sounds') audioEngine.setSfxEnabled(next);
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <TalkiCard>
        <TalkiHeading level={3}>הקראה ותצוגה</TalkiHeading>
        <TalkiText weight="bold">מהירות דיבור</TalkiText>
        <View style={styles.seg}>
          {RATES.map((r) => (
            <Seg
              key={r.v}
              testID={testIds.parent.settingsRate(r.v)}
              label={r.label}
              on={settings.rate === r.v}
              onPress={() => void patchSettings({ rate: r.v })}
            />
          ))}
        </View>
        <Toggle
          testID={testIds.parent.settingsNiqqud}
          label="ניקוד"
          on={settings.niqqud}
          onPress={() => toggle('niqqud')}
        />
        <Toggle
          testID={testIds.parent.settingsMusic}
          label="מוזיקת רקע"
          on={settings.music}
          onPress={() => toggle('music')}
        />
        <TalkiText weight="bold">עוצמת המוזיקה</TalkiText>
        <View style={styles.seg}>
          {VOLS.map((r) => (
            <Seg
              key={r.v}
              testID={testIds.parent.settingsMusicVol(r.v)}
              label={r.label}
              on={settings.musicVol === r.v}
              onPress={() => {
                void patchSettings({ musicVol: r.v });
                audioEngine.setMusicVolumeMultiplier(r.v);
              }}
            />
          ))}
        </View>
        <Toggle
          testID={testIds.parent.settingsSounds}
          label="צלילי פידבק"
          on={settings.sounds}
          onPress={() => toggle('sounds')}
        />
        <Toggle
          testID={testIds.parent.settingsVoice}
          label="הוראות קוליות"
          on={settings.voice}
          onPress={() => toggle('voice')}
        />
        <Toggle
          testID={testIds.parent.settingsEffects}
          label="קונפטי ואנימציות"
          on={settings.effects}
          onPress={() => toggle('effects')}
        />
      </TalkiCard>

      <TalkiCard>
        <BackupPanel />
      </TalkiCard>

      <TalkiCard>
        <TalkiHeading level={3}>פרטיות</TalkiHeading>
        <TalkiText color={v3.textSecondary}>
          אין חשבון ואין שרת. מילים והקלטות נשארות במכשיר. בגרסת החנות מוצג באנר מודעות לילדים (לא מותאם אישית).
        </TalkiText>
        <TalkiButton label="מדיניות פרטיות" variant="ghost" onPress={() => void Linking.openURL(PRIVACY)} />
      </TalkiCard>

      <TalkiCard>
        <TalkiHeading level={3}>איפוס</TalkiHeading>
        <TalkiText color={v3.textSecondary}>מוחק מדבקות וסטטיסטיקות בלבד</TalkiText>
        {confirming ? (
          <View style={styles.confirm}>
            <TalkiText>{RESET_CONFIRM_TEXT}</TalkiText>
            <TalkiText>{RESET_DELETES_TEXT}</TalkiText>
            <TalkiText>{RESET_KEEPS_TEXT}</TalkiText>
            <TalkiButton
              testID={testIds.parent.settingsResetConfirm}
              label="אישור איפוס"
              onPress={() => {
                void resetProgress();
                setConfirming(false);
              }}
            />
          </View>
        ) : (
          <TalkiButton
            testID={testIds.parent.settingsReset}
            label="איפוס"
            variant="secondary"
            onPress={() => setConfirming(true)}
          />
        )}
      </TalkiCard>
    </ScrollView>
  );
}

function Seg({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.segBtn, on && styles.segOn]}
    >
      <TalkiText weight="semibold">{label}</TalkiText>
    </Pressable>
  );
}

function Toggle({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={styles.toggle}
    >
      <TalkiText weight="bold">{label}</TalkiText>
      <View style={[styles.sw, on && styles.swOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12, paddingBlockEnd: 32 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBlock: 8 },
  segBtn: {
    minHeight: 48,
    paddingInline: 12,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: { backgroundColor: v3.surface, borderColor: v3.purple600 },
  toggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBlock: 4,
  },
  sw: { width: 44, height: 28, borderRadius: 14, backgroundColor: v3.borderSoft },
  swOn: { backgroundColor: v3.purple600 },
  confirm: { gap: 8, marginBlockStart: 8 },
});
