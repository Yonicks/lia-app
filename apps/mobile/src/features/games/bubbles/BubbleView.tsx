import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { TalkiText } from '@/design-system/components';
import { useTalkiReducedMotion } from '@/design-system/motion';
import { display } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

import { WordArt } from '../shell/WordArt';
import type { Bubble } from './bubblesReducer';

/**
 * Play-area-local bubble view.
 * Native: Reanimated rise within measured stage height.
 * Web (Playwright): static spawn positions so screenshots/clicks stay stable;
 * motion is attested on native device coverage.
 */
export function BubbleView({
  bubble,
  stageHeight,
  niqqud,
  onPop,
  onExpire,
}: {
  bubble: Bubble;
  stageHeight: number;
  niqqud: boolean;
  onPop: () => void;
  onExpire: () => void;
}) {
  const rise = Math.max(stageHeight + bubble.size, bubble.size + 80);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const id = setTimeout(() => onExpireRef.current(), bubble.duration * 1000 + 300);
    return () => clearTimeout(id);
  }, [bubble.id, bubble.duration]);

  if (Platform.OS === 'web') {
    return (
      <Pressable
        testID={testIds.bubbles.bubble(bubble.id)}
        accessibilityRole="button"
        accessibilityLabel={display(bubble.word.word, niqqud)}
        onPress={onPop}
        style={[
          styles.bubble,
          styles.abs,
          {
            width: bubble.size,
            height: bubble.size,
            insetInlineStart: `${bubble.start}%`,
          } as never,
        ]}
      >
        <WordArt word={bubble.word} size="56%" />
        <TalkiText align="center" style={styles.label}>
          {display(bubble.word.word, niqqud)}
        </TalkiText>
      </Pressable>
    );
  }

  return <NativeRisingBubble bubble={bubble} rise={rise} niqqud={niqqud} onPop={onPop} />;
}

function NativeRisingBubble({
  bubble,
  rise,
  niqqud,
  onPop,
}: {
  bubble: Bubble;
  rise: number;
  niqqud: boolean;
  onPop: () => void;
}) {
  const reduceMotion = useTalkiReducedMotion();
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);

  useEffect(() => {
    ty.value = 0;
    tx.value = 0;
    if (reduceMotion) {
      // Still tappable; skip decorative rise so feedback stays readable.
      return;
    }
    ty.value = withTiming(-rise, {
      duration: bubble.duration * 1000,
      easing: Easing.linear,
    });
    tx.value = withTiming(bubble.drift, {
      duration: bubble.duration * 1000,
      easing: Easing.linear,
    });
  }, [bubble.id, bubble.duration, bubble.drift, rise, ty, tx, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: tx.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.abs,
        {
          width: bubble.size,
          height: bubble.size,
          insetInlineStart: `${bubble.start}%`,
        } as never,
        style,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        testID={testIds.bubbles.bubble(bubble.id)}
        accessibilityRole="button"
        accessibilityLabel={display(bubble.word.word, niqqud)}
        onPress={onPop}
        style={styles.bubbleFill}
      >
        <WordArt word={bubble.word} size="56%" />
        <TalkiText align="center" style={styles.label}>
          {display(bubble.word.word, niqqud)}
        </TalkiText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
    bottom: 8,
  },
  bubble: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  bubbleFill: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  label: {
    fontSize: 11,
  },
});
