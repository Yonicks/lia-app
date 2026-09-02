import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiPill } from '@/design-system/components';
import { categoryTheme } from '@/design-system/categoryTheme';
import type { GameCatChips } from '@/domain/games/gameCatChips';
import type { CategoryId } from '@/domain/types';
import { plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

export interface GameCatChipRowProps {
  chips: GameCatChips;
  current: string | null;
  onSelect: (id: CategoryId) => void;
  /** Games menu owns the plan's `games-menu-chip-<id>` testIds; the
   *  practice menu reuses the same chip row visually (index.html 2412)
   *  without a second identifier namespace. */
  testIDFactory?: (id: string) => string;
}

/**
 * index.html `gameCatChips()` (2282-2291) — a wrap row of Talki chips,
 * only categories with 4+ items. Used by both the games menu and the
 * practice menu so choosing a category never happens inside a round.
 */
export function GameCatChipRow({ chips, current, onSelect, testIDFactory }: GameCatChipRowProps) {
  const idFor = testIDFactory ?? testIds.gamesMenu.chip;
  return (
    <View style={styles.chipRow}>
      {chips.cats.map((cat) => (
        <Pressable
          key={cat.id}
          testID={idFor(cat.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: cat.id === current }}
          onPress={() => onSelect(cat.id)}
          style={styles.chipTouch}
        >
          <TalkiPill
            label={plain(cat.title)}
            backgroundColor={cat.id === current ? categoryTheme[cat.id].gradientFrom : undefined}
            color={cat.id === current ? '#fff' : undefined}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipTouch: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
