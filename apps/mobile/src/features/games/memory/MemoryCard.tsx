import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { display } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../shell/WordArt';
import type { MemoryCard as MemoryCardModel } from './memoryReducer';

export function MemoryCard({
  card,
  niqqud,
  onPress,
  minSize = 64,
}: {
  card: MemoryCardModel;
  niqqud: boolean;
  onPress: () => void;
  /** Token-driven minimum edge (Phase 24). */
  minSize?: number;
}) {
  const shown = card.open || card.matched;
  return (
    <Pressable
      testID={testIds.memory.card(card.idx)}
      accessibilityRole="button"
      accessibilityLabel={shown ? display(card.it.word, niqqud) : 'סגור'}
      onPress={onPress}
      style={[
        styles.card,
        shadowSm,
        { minWidth: minSize, minHeight: minSize },
        shown && styles.open,
        card.matched && styles.matched,
      ]}
    >
      {shown ? (
        card.kind === 'pic' ? (
          <WordArt word={card.it} />
        ) : (
          <TalkiText weight="extrabold" align="center">
            {display(card.it.word, niqqud)}
          </TalkiText>
        )
      ) : (
        <View>
          <TalkiText align="center" color={v3.textSecondary}>
            ❔
          </TalkiText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  open: {
    borderColor: v3.purple200,
  },
  matched: {
    borderColor: v3.green500,
  },
});
