import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ToastHost } from '@/components/shell';
import {
  LandscapeActivityCard,
  LandscapeActivityGrid,
  LandscapeTitle,
  landscapeTokens,
} from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { gameCatChips } from '@/domain/games/gameCatChips';
import { PRACTICE_LIST } from '@/domain/practice/list';
import { practiceCardImage } from '@/domain/practice/practiceCards';
import { practiceHref } from '@/domain/navigation/routes';
import type { CategoryId, PracticeModeId } from '@/domain/types';
import { GameCatChipRow } from '@/features/games/GameCatChipRow';
import { LandscapeHubFrame } from '@/features/shell/LandscapeHubFrame';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

const PRACTICE_SUBTITLE = 'בואו נתרגל לדבר, להבין ולבטא מילים ומשפטים';

/**
 * Landscape Practice hub (Phase 22).
 *
 * Composition (matches `docs/design/landscape/reference/practice.png`):
 *   world background + top chrome + side nav (LandscapeHubFrame)
 *   LandscapeTitle with the reference subtitle
 *   category chips (preserved launch context)
 *   3×2 LandscapeActivityGrid for all six PRACTICE_LIST modes
 *
 * All six registered practice modes remain reachable; launch/gating
 * semantics are unchanged (practiceHref + chip category context).
 */
export function PracticeMenuScreen() {
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { hydrated, custom, lastCat, learned, hydrate } = useProgressStore();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  useEffect(() => {
    if (!hydrated) void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  const chips = gameCatChips(custom, lastCat as CategoryId | null);
  const [activeChip, setActiveChip] = useState<CategoryId | null>(chips?.current ?? null);
  const currentChip = activeChip ?? chips?.current ?? null;

  const openPractice = useCallback(
    (id: PracticeModeId) => {
      push(practiceHref(id, currentChip));
    },
    [push, currentChip],
  );

  return (
    <LandscapeHubFrame
      hub="practice"
      testID={testIds.practiceMenu.root}
      points={learned.size}
      musicOn={settings.music}
      onToggleMusic={() => void toggleMusic()}
      onBrandLongPress={parent.onBrandLongPress}
      onBrandShortPress={parent.onBrandShortPress}
      titleSlot={
        <LandscapeTitle
          testID={testIds.practiceMenu.title}
          title="תרגול דיבור"
          subtitle={PRACTICE_SUBTITLE}
        />
      }
    >
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <View style={[styles.body, { gap: tokens.gap }]}>
        {chips ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
            style={styles.chipStrip}
          >
            <GameCatChipRow
              chips={chips}
              current={currentChip}
              onSelect={(id) => setActiveChip(id)}
              nowrap
              testIDFactory={(id) => testIds.practiceMenu.chip(id)}
            />
          </ScrollView>
        ) : null}

        <View style={styles.gridHost} testID={testIds.practiceMenu.grid}>
          <LandscapeActivityGrid>
            {PRACTICE_LIST.map(([id, , title]) => (
              <LandscapeActivityCard
                key={id}
                testID={testIds.practiceMenu.card(id)}
                title={title}
                image={practiceCardImage(id)}
                footerVariant="banner"
                onPress={() => openPractice(id)}
              />
            ))}
          </LandscapeActivityGrid>
        </View>
      </View>
    </LandscapeHubFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
  },
  chipStrip: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 56,
  },
  chipScroll: {
    alignItems: 'center',
    paddingInline: 2,
    flexDirection: 'row',
  },
  gridHost: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});
