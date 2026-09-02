import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { TalkiCard, TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { ToastHost, TopBar } from '@/components/shell';
import { useDevice } from '@/design-system/responsive/useDevice';
import { homePaddingInline } from '@/design-system/theme/spacing';
import { GAMES } from '@/domain/games/ids';
import { gameCardImage } from '@/domain/games/gameCards';
import { gameCatChips } from '@/domain/games/gameCatChips';
import { gameHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { GameArtCard } from '@/features/home/GameArtCard';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { GameCatChipRow } from './GameCatChipRow';

/**
 * index.html `renderGamesMenu()` (2354-2391) — all 11 games, unlike Home's
 * fixed three. `gameCatChips()` (2282-2291) supplies the category chip row
 * (only categories with 4+ items). Cards route to a stub — no game is
 * built in this phase (phase-07 prompt, "Do not build any game").
 */
export function GamesMenuScreen() {
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
    <TalkiScreen testID={testIds.gamesMenu.root}>
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
          משחקים
        </TalkiHeading>

        {chips ? (
          <GameCatChipRow chips={chips} current={currentChip} onSelect={(id) => setActiveChip(id)} />
        ) : null}

        <View style={styles.grid}>
          {GAMES.map((game) => {
            const art = gameCardImage(game.id);
            if (art) {
              return (
                <GameArtCard
                  key={game.id}
                  testID={testIds.gamesMenu.card(game.id)}
                  title={game.title}
                  image={art}
                  onPress={() => push(gameHref(game.id, currentChip as CategoryId | null))}
                />
              );
            }
            return (
              <TalkiCard
                key={game.id}
                testID={testIds.gamesMenu.card(game.id)}
                onPress={() => push(gameHref(game.id, currentChip as CategoryId | null))}
                style={[styles.plainCard, game.id === 'match' && styles.wideCard]}
              >
                <TalkiText weight="extrabold">{game.title}</TalkiText>
              </TalkiCard>
            );
          })}
        </View>
      </ScrollView>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBlock: 16,
    gap: 16,
  },
  heading: {
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plainCard: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 120,
    minHeight: 96,
    justifyContent: 'flex-end',
  },
  wideCard: {
    flexBasis: '100%',
    minWidth: '100%',
  },
});
