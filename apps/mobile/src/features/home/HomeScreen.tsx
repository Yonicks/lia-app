import { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { TalkiScreen } from '@/design-system/components';
import { TopBar } from '@/components/shell';
import { homePaddingInline, homeSectionGap } from '@/design-system/theme/spacing';
import { useDevice } from '@/design-system/responsive/useDevice';
import { categoryHref, gameHref, gamesMenuHref, practiceHref, practiceMenuHref } from '@/domain/navigation/routes';
import type { CategoryId, GameId, PracticeModeId } from '@/domain/types';
import { useGuardedPush } from '@/hooks/useGuardedPush';
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
 */
export function HomeScreen() {
  const push = useGuardedPush();
  const { deviceClass } = useDevice();
  const data = useHomeData();
  const { settings, toggleMusic } = useSettingsStore();

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
    return <TalkiScreen testID={testIds.home.root}>{null}</TalkiScreen>;
  }

  return (
    <TalkiScreen testID={testIds.home.root}>
      <TopBar points={data.points} musicOn={settings.music} onToggleMusic={() => void toggleMusic()} />
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
        <HomePracticeRow onOpen={openPractice} onOpenAll={() => push(practiceMenuHref)} />
        <HomeGamesRow onOpen={openGame} onOpenAll={() => push(gamesMenuHref)} />
        <DevStorageProbe />
      </ScrollView>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBlock: 16,
  },
});
