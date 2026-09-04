import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TalkiHeading, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { testIds } from '@/testing/testIds';

import { ParentGateScreen } from './ParentGateScreen';
import { ParentShell } from './ParentShell';
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

/**
 * Parent Center host — landscape (Phase 27).
 * Gate → unlocked tabs. One tab mounted at a time (no conflicting stacks).
 * Horizontal tab strip for short landscape height; adult form scroll OK.
 */
export function ParentScreen() {
  const { unlocked, unlock } = useParentLock();
  const [tab, setTab] = useState<TabId>('settings');
  const router = useRouter();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);

  if (!unlocked) {
    return <ParentGateScreen onUnlocked={unlock} />;
  }

  return (
    <ParentShell
      testID={testIds.parent.root}
      header={
        <View style={[styles.header, { minHeight: tokens.topBarMinHeight, paddingInline: tokens.padInline }]}>
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
      }
      tabs={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabs, { gap: Math.max(6, tokens.gap - 4), paddingInline: tokens.padInline }]}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>
      }
    >
      {tab === 'settings' ? <SettingsTab /> : null}
      {tab === 'record' ? <RecordTab /> : null}
      {tab === 'words' ? <WordsTab /> : null}
      {tab === 'report' ? <ReportTab /> : null}
      {tab === 'method' ? <MethodTab /> : null}
    </ParentShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: 4,
  },
  back: { minHeight: 48, minWidth: 48, justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBlockEnd: 6,
  },
  tab: {
    minHeight: 48,
    paddingInline: 12,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    justifyContent: 'center',
  },
  tabOn: { borderColor: v3.purple600, backgroundColor: v3.surface },
});
