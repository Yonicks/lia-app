import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ToastHost } from '@/components/shell';
import {
  LandscapeActivityCard,
  LandscapeActivityGrid,
  LandscapePageIndicator,
  LandscapeTitle,
  landscapeTokens,
} from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { gameCardImage } from '@/domain/games/gameCards';
import { gameCatChips } from '@/domain/games/gameCatChips';
import { GAMES_HUB_PAGE_SIZE, gameHubPages } from '@/domain/games/gameHubPages';
import { GAMES } from '@/domain/games/ids';
import { gameHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { LandscapeHubFrame } from '@/features/shell/LandscapeHubFrame';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { GameCatChipRow } from './GameCatChipRow';

const GAMES_SUBTITLE = 'בואו נשחק, נחשוב ונלמד ביחד';

/**
 * Landscape Games hub (Phase 21).
 *
 * Composition (matches `docs/design/landscape/reference/games.png`):
 *   world background + top chrome + side nav (LandscapeHubFrame)
 *   LandscapeTitle + category chips (preserved launch context)
 *   3×2 LandscapeActivityGrid for the active page (page size 6)
 *   LandscapePageIndicator when more than one page
 *
 * All eleven registered games remain reachable via child-friendly page
 * dots; only the active page mounts cards so the hub stays viewport-bound
 * and off-page controls are not hit-test ghosts.
 */
export function GamesMenuScreen() {
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

  const pages = useMemo(() => gameHubPages(GAMES, GAMES_HUB_PAGE_SIZE), []);
  const [pageIndex, setPageIndex] = useState(0);
  const activePage = pages[pageIndex] ?? pages[0] ?? [];

  const selectPage = useCallback(
    (index: number) => {
      setPageIndex(Math.max(0, Math.min(index, pages.length - 1)));
    },
    [pages.length],
  );

  const openGame = useCallback(
    (id: (typeof GAMES)[number]['id']) => {
      push(gameHref(id, currentChip as CategoryId | null));
    },
    [push, currentChip],
  );

  return (
    <LandscapeHubFrame
      hub="games"
      testID={testIds.gamesMenu.root}
      points={learned.size}
      musicOn={settings.music}
      onToggleMusic={() => void toggleMusic()}
      onBrandLongPress={parent.onBrandLongPress}
      onBrandShortPress={parent.onBrandShortPress}
      titleSlot={
        <LandscapeTitle
          testID={testIds.gamesMenu.title}
          title="משחקים"
          subtitle={GAMES_SUBTITLE}
        />
      }
      auxiliary={
        <LandscapePageIndicator
          testID={testIds.gamesMenu.pageIndicator}
          pageCount={pages.length}
          activeIndex={pageIndex}
          onSelect={selectPage}
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
            />
          </ScrollView>
        ) : null}

        <View style={styles.gridHost} testID={testIds.gamesMenu.grid}>
          <View style={styles.page} testID={testIds.gamesMenu.page(pageIndex)}>
            <LandscapeActivityGrid>
              {activePage.map((game) => (
                <LandscapeActivityCard
                  key={game.id}
                  testID={testIds.gamesMenu.card(game.id)}
                  title={game.title}
                  image={gameCardImage(game.id)}
                  footerVariant="pill"
                  onPress={() => openGame(game.id)}
                />
              ))}
            </LandscapeActivityGrid>
          </View>
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
  page: {
    flex: 1,
    minHeight: 0,
  },
});
