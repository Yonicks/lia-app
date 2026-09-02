import { ScrollView, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

import { TalkiCard, TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { ToastHost, TopBar } from '@/components/shell';
import { v3 } from '@/design-system/theme/colors';
import { useDevice } from '@/design-system/responsive/useDevice';
import { homePaddingInline } from '@/design-system/theme/spacing';
import { gameCatChips } from '@/domain/games/gameCatChips';
import { PRACTICE_LIST } from '@/domain/practice/list';
import { practiceHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { GameCatChipRow } from '@/features/games/GameCatChipRow';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

/**
 * index.html `renderPractice()` (2394-2414) — the full six-entry
 * `PRACTICE_LIST` (Home shows only three) plus `gameCatChips()` (2412).
 * Cards route to the Phase 11 practice modes.
 */
export function PracticeMenuScreen() {
  const push = useGuardedPush();
  const { deviceClass } = useDevice();
  const { hydrated, custom, lastCat, learned, hydrate } = useProgressStore();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  useEffect(() => {
    if (!hydrated) void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const chips = gameCatChips(custom, lastCat as CategoryId | null);
  const [activeChip, setActiveChip] = useState<CategoryId | null>(chips?.current ?? null);
  const currentChip = activeChip ?? chips?.current ?? null;

  return (
    <TalkiScreen testID={testIds.practiceMenu.root}>
      <TopBar
        points={learned.size}
        musicOn={settings.music}
        onToggleMusic={() => void toggleMusic()}
        onBrandLongPress={parent.onBrandLongPress}
        onBrandShortPress={parent.onBrandShortPress}
      />
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <ScrollView contentContainerStyle={[styles.content, { paddingInline: homePaddingInline(deviceClass) }]}>
        <TalkiHeading level={1} style={styles.heading}>
          תרגול דיבור
        </TalkiHeading>
        <TalkiText color={v3.textSecondary}>שיטות מבוססות-מחקר לתרגול הפקת מילים</TalkiText>

        {chips ? (
          <GameCatChipRow
            chips={chips}
            current={currentChip}
            onSelect={(id) => setActiveChip(id)}
            testIDFactory={(id) => `practice-menu-chip-${id}`}
          />
        ) : null}

        {PRACTICE_LIST.map(([id, , title, description]) => (
          <TalkiCard
            key={id}
            testID={testIds.practiceMenu.card(id)}
            onPress={() => push(practiceHref(id, currentChip))}
            style={styles.card}
          >
            <TalkiHeading level={3}>{title}</TalkiHeading>
            <TalkiText color={v3.textSecondary}>{description}</TalkiText>
          </TalkiCard>
        ))}
      </ScrollView>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBlock: 16,
    gap: 12,
  },
  heading: {
    marginBottom: 4,
  },
  card: {
    gap: 4,
  },
});
