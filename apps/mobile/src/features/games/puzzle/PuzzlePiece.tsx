/* Reanimated shared values are mutated by design; the hooks plugin treats
 * `.value =` as an immutable violation. Same exception as IntroSequence. */
/* eslint-disable react-hooks/immutability */
import { useCallback } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../shell/WordArt';
import type { PuzzlePieceState } from './puzzleReducer';

export function PuzzlePiece({
  piece,
  selected,
  nudge,
  niqqud,
  onTap,
  onDragStart,
  onDragEnd,
}: {
  piece: PuzzlePieceState;
  selected: boolean;
  nudge: boolean;
  niqqud: boolean;
  onTap: () => void;
  onDragStart: () => void;
  onDragEnd: (cx: number, cy: number, box: { x: number; y: number; width: number; height: number }) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const dragging = useSharedValue(false);
  const pw = useSharedValue(88);
  const ph = useSharedValue(96);
  const pointerId = useSharedValue<number | string | null>(null);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const moved = useSharedValue(false);

  const returnHome = useCallback(() => {
    tx.value = withTiming(0, { duration: 280 });
    ty.value = withTiming(0, { duration: 280 });
  }, [tx, ty]);

  const reportDrop = useCallback(
    (pageX: number, pageY: number, w: number, h: number) => {
      onDragEnd(pageX, pageY, { x: pageX - w / 2, y: pageY - h / 2, width: w, height: h });
      returnHome();
    },
    [onDragEnd, returnHome],
  );

  const pan = Gesture.Pan()
    .enabled(Platform.OS !== 'web' && !piece.placed)
    .minDistance(8)
    .onStart(() => {
      dragging.value = true;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      dragging.value = false;
      runOnJS(reportDrop)(e.absoluteX, e.absoluteY, pw.value, ph.value);
    })
    .onFinalize((_, success) => {
      if (!success) {
        dragging.value = false;
        tx.value = withTiming(0, { duration: 280 });
        ty.value = withTiming(0, { duration: 280 });
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    zIndex: dragging.value ? 20 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={style}
        onLayout={(e) => {
          pw.value = e.nativeEvent.layout.width;
          ph.value = e.nativeEvent.layout.height;
        }}
      >
        <Pressable
          testID={testIds.puzzle.piece(piece.id)}
          accessibilityRole="button"
          accessibilityLabel={plain(piece.it.word)}
          disabled={piece.placed}
          onPress={() => {
            if (moved.value) return;
            onTap();
          }}
          onPressIn={(e) => {
            if (piece.placed) return;
            pointerId.value = e.nativeEvent.identifier;
            startX.value = e.nativeEvent.pageX;
            startY.value = e.nativeEvent.pageY;
            moved.value = false;
          }}
          onTouchMove={(e) => {
            if (pointerId.value === null) return;
            const dx = e.nativeEvent.pageX - startX.value;
            const dy = e.nativeEvent.pageY - startY.value;
            if (!moved.value && Math.hypot(dx, dy) > 8) {
              moved.value = true;
              onDragStart();
            }
            if (moved.value) {
              tx.value = dx;
              ty.value = dy;
            }
          }}
          onPressOut={(e) => {
            if (pointerId.value === null) return;
            const wasMoved = moved.value;
            pointerId.value = null;
            if (!wasMoved) return;
            reportDrop(e.nativeEvent.pageX, e.nativeEvent.pageY, pw.value, ph.value);
          }}
          onResponderTerminate={() => {
            pointerId.value = null;
            returnHome();
          }}
          style={[
            styles.piece,
            shadowSm,
            piece.placed && styles.placed,
            selected && styles.sel,
            nudge && styles.nudge,
          ]}
        >
          <WordArt word={piece.it} size="64%" />
          <TalkiText align="center">{display(piece.it.word, niqqud)}</TalkiText>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  piece: {
    minWidth: 88,
    minHeight: 96,
    padding: 8,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  placed: {
    opacity: 0.35,
  },
  sel: {
    borderColor: v3.blue500,
  },
  nudge: {
    borderColor: v3.gold500,
  },
});
