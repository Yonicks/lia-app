import { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ToastHost } from '@/components/shell';
import { LandscapeScreen } from '@/design-system/landscape';
import { homePaddingInline, homeSectionGap } from '@/design-system/theme/spacing';
import { useDevice } from '@/design-system/responsive/useDevice';
import { categoryHref, gameHref, gamesMenuHref, practiceHref, practiceMenuHref } from '@/domain/navigation/routes';
import type { CategoryId, GameId, PracticeModeId } from '@/domain/types';
import { LandscapeHubFrame } from '@/features/shell/LandscapeHubFrame';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useGuardedReplace } from '@/hooks/useGuardedReplace';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useSettingsStore } from '@/state/settingsStore';
import { DevStorageProbe } from '@/testing/DevStorageProbe';
import { testIds } from '@/testing/testIds';

import { CategoryGrid } from './CategoryGrid';
import { ContinueLearningHero } from './ContinueLearningHero';
import { HomeGamesRow } from './HomeGamesRow';
import { HomePracticeRow } from './HomePracticeRow';
import { useHomeData } from './useHomeData';

/**
 * index.html `renderHome()` (2227-2270) — section order is fixed: hero
 * (only when `currentCategory()` returns one), categories, practice, games.
 * Visual arrangement follows `docs/design/talki-home-approved.png`; the
 * hero specifically follows the newer `talki-home-hero-mockup.png`
 * (phase-07-plan.md "Which mock governs").
 *
 * Phase 19: lives inside LandscapeHubFrame (top/side chrome); inner content
 * unchanged until Phase 20.
 */
export function HomeScreen() {
  const push = useGuardedPush();
  const replace = useGuardedReplace();
  const { deviceClass } = useDevice();
  const data = useHomeData();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();

  const openCategory = useCallback(
    (id: CategoryId) => {
      push(categoryHref(id));
    },
    [push],
  );

  const openPractice = useCallback(
    (id: PracticeModeId) => {
      push(practiceHref(id));
    },
    [push],
  );

  const openGame = useCallback(
    (id: GameId) => {
      push(gameHref(id));
    },
    [push],
  );

  if (!data.ready) {
    return <LandscapeScreen testID={testIds.home.root}>{null}</LandscapeScreen>;
  }

  return (
    <LandscapeHubFrame
      hub="home"
      testID={testIds.home.root}
      points={data.points}
      musicOn={settings.music}
      onToggleMusic={() => void toggleMusic()}
      onBrandLongPress={parent.onBrandLongPress}
      onBrandShortPress={parent.onBrandShortPress}
    >
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingInline: homePaddingInline(deviceClass), gap: homeSectionGap },
        ]}
      >
        {data.hero ? (
          <ContinueLearningHero
            category={data.hero}
            learned={data.heroLearned}
            points={data.points}
            onContinue={() => openCategory(data.hero!.id)}
          />
        ) : null}
        <CategoryGrid categories={data.categories} learnedByCategory={data.learnedByCategory} onOpen={openCategory} />
        <HomePracticeRow onOpen={openPractice} onOpenAll={() => replace(practiceMenuHref)} />
        <HomeGamesRow onOpen={openGame} onOpenAll={() => replace(gamesMenuHref)} />
        <DevStorageProbe />
      </ScrollView>
    </LandscapeHubFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBlock: 16,
  },
});
