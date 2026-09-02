import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { testIds } from '@/testing/testIds';

import { ParentGateScreen } from './ParentGateScreen';
import { MethodTab } from './tabs/MethodTab';
import { RecordTab } from './tabs/RecordTab';
import { ReportTab } from './tabs/ReportTab';
import { SettingsTab } from './tabs/SettingsTab';
import { WordsTab } from './tabs/WordsTab';
import { useParentLock } from './useParentLock';

const TABS = [
  ['settings', 'הגדרות'],
  ['record', 'הקלטות'],
  ['words', 'מילים שלי'],
  ['report', 'דוח'],
  ['method', 'השיטה'],
] as const;

type TabId = (typeof TABS)[number][0];

export function ParentScreen() {
  const { unlocked, unlock } = useParentLock();
  const [tab, setTab] = useState<TabId>('settings');
  const router = useRouter();

  if (!unlocked) {
    return <ParentGateScreen onUnlocked={unlock} />;
  }

  return (
    <TalkiScreen testID={testIds.parent.root}>
      <View style={styles.header}>
        <Pressable
          testID={testIds.parent.gateBack}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.back}
        >
          <TalkiText weight="semibold">חזרה</TalkiText>
        </Pressable>
        <TalkiHeading level={2}>מסך הורים</TalkiHeading>
        <View style={styles.back} />
      </View>
      <View style={styles.tabs}>
        {TABS.map(([id, label]) => (
          <Pressable
            key={id}
            testID={testIds.parent.tab(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            onPress={() => setTab(id)}
            style={[styles.tab, tab === id && styles.tabOn]}
          >
            <TalkiText weight="semibold">{label}</TalkiText>
          </Pressable>
        ))}
      </View>
      {tab === 'settings' ? <SettingsTab /> : null}
      {tab === 'record' ? <RecordTab /> : null}
      {tab === 'words' ? <WordsTab /> : null}
      {tab === 'report' ? <ReportTab /> : null}
      {tab === 'method' ? <MethodTab /> : null}
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: 12,
    paddingBlock: 8,
    minHeight: 56,
  },
  back: { minHeight: 48, minWidth: 48, justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingInline: 12,
    paddingBlockEnd: 8,
  },
  tab: {
    minHeight: 48,
    paddingInline: 10,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    justifyContent: 'center',
  },
  tabOn: { borderColor: v3.purple600, backgroundColor: v3.surface },
});
