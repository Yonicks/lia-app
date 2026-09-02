import { Image, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { HOME_GAMES } from '@/domain/games/homeGames';
import { gameCardImage } from '@/domain/games/gameCards';
import type { GameId } from '@/domain/types';
import { testIds } from '@/testing/testIds';

import { GameArtCard } from './GameArtCard';

export interface HomeGamesRowProps {
  onOpen: (id: GameId) => void;
  onOpenAll: () => void;
}

/**
 * index.html `renderHome()`'s "משחקים" section — EXACTLY the three fixed
 * games at index.html 2237-2241 (`memory`, `quiz`, `missing`, in that
 * order), never the full eleven-game menu. Each card is the illustrated
 * `talki-game-card-*.png` cover, matching both the approved mock and the
 * current legacy Home.
 */
export function HomeGamesRow({ onOpen, onOpenAll }: HomeGamesRowProps) {
  return (
    <View testID={testIds.home.sectionGames}>
      <View style={styles.headerRow}>
        <View style={styles.headingGroup}>
          <Image source={uiIcons.games} style={styles.headingIcon} resizeMode="contain" />
          <TalkiHeading level={2}>משחקים</TalkiHeading>
        </View>
        <TalkiCard testID={testIds.home.allGames} onPress={onOpenAll} style={styles.allLink}>
          <TalkiText weight="bold">הכל</TalkiText>
        </TalkiCard>
      </View>
      <View style={styles.row}>
        {HOME_GAMES.map((game) => {
          const art = gameCardImage(game.id);
          if (!art) return null;
          return (
            <GameArtCard
              key={game.id}
              testID={testIds.home.game(game.id)}
              title={game.title}
              image={art}
              onPress={() => onOpen(game.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingIcon: {
    width: 25,
    height: 25,
  },
  allLink: {
    minHeight: 48,
    minWidth: 48,
    paddingBlock: 8,
    paddingInline: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
