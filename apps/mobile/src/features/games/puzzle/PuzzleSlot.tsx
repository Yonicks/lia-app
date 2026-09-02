import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { v3 } from '@/design-system/theme/colors';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../shell/WordArt';
import type { PuzzlePieceState } from './puzzleReducer';

export function PuzzleSlot({
  piece,
  hinted,
  niqqud,
  onPress,
  onLayoutBox,
}: {
  piece: PuzzlePieceState;
  hinted: boolean;
  niqqud: boolean;
  onPress: () => void;
  onLayoutBox: (box: { x: number; y: number; width: number; height: number }) => void;
}) {
  const host = useRef<View>(null);
  return (
    <Pressable
      ref={host}
      testID={testIds.puzzle.slot(piece.id)}
      accessibilityRole="button"
      accessibilityLabel={piece.placed ? plain(piece.it.word) : `המקום של ${plain(piece.it.word)}`}
      onPress={onPress}
      onLayout={() => {
        host.current?.measureInWindow((x, y, width, height) => {
          onLayoutBox({ x, y, width, height });
        });
      }}
      style={[styles.slot, piece.placed && styles.filled, hinted && styles.hint]}
    >
      <View style={styles.shadow} pointerEvents="none">
        <WordArt word={piece.it} size="70%" />
      </View>
      {piece.placed ? (
        <View style={styles.fill} pointerEvents="none">
          <WordArt word={piece.it} size="70%" />
          <TalkiText align="center">{display(piece.it.word, niqqud)}</TalkiText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexGrow: 1,
    flexBasis: 88,
    minWidth: 72,
    minHeight: 88,
    aspectRatio: 1,
    borderRadius: radii.card,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: v3.borderSoft,
    backgroundColor: v3.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filled: {
    borderStyle: 'solid',
    borderColor: v3.green500,
    backgroundColor: v3.surface,
  },
  hint: {
    borderColor: v3.gold500,
    borderStyle: 'solid',
  },
  shadow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
