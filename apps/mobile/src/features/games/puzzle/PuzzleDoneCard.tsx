import { Image, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { puzzleStars, puzzleTogetherLine } from '@/domain/games/puzzle';
import { display } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

import type { PuzzleState } from './puzzleReducer';

export function PuzzleDoneCard({
  state,
  niqqud,
  onReplay,
  onHome,
}: {
  state: PuzzleState;
  niqqud: boolean;
  onReplay: () => void;
  onHome: () => void;
}) {
  const filled = puzzleStars(state.misses);
  const words = state.pieces.map((p) => display(p.it.word, niqqud)).join(' · ');
  const together = puzzleTogetherLine(state.boards);

  return (
    <View testID={testIds.puzzle.done} style={[styles.card, shadowCard]}>
      <View testID={testIds.game.doneStars} style={styles.stars} accessibilityLabel={`${filled} כוכבים`}>
        {[0, 1, 2].map((i) => (
          <Image
            key={i}
            source={uiIcons.star}
            style={[styles.star, i < filled ? styles.on : styles.off]}
            resizeMode="contain"
          />
        ))}
      </View>
      <TalkiHeading level={1} align="center">
        הַפָּאזֶל שָׁלֵם!
      </TalkiHeading>
      <TalkiText align="center" color={v3.textSecondary}>
        {words}
      </TalkiText>
      {together ? (
        <TalkiText testID={testIds.puzzle.together} align="center" color={v3.textHeading}>
          {together}
        </TalkiText>
      ) : null}
      <View style={styles.actions}>
        <TalkiButton testID={testIds.game.doneReplay} label="עוד פעם" onPress={onReplay} />
        <TalkiButton testID={testIds.game.doneHome} label="🏠 הביתה" variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginInline: 20,
    padding: 24,
    borderRadius: radii.hero,
    backgroundColor: v3.surface,
    alignItems: 'center',
    gap: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    width: 44,
    height: 44,
  },
  on: {
    opacity: 1,
  },
  off: {
    opacity: 0.3,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
});
