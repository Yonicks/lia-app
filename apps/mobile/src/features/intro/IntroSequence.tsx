import { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { TalkiText } from '@/design-system/components';
import { REDUCED_MOTION_INTRO_HOLD_MS, useTalkiReducedMotion } from '@/design-system/motion';
import { v3 } from '@/design-system/theme/colors';
import { useDevice } from '@/design-system/responsive/useDevice';
import { testIds } from '@/testing/testIds';

import { INTRO_LAYER_ASSETS, INTRO_SPARKLE_POINTS } from './layers';
import { INTRO_TIMELINE, INTRO_TOTAL_MS, type IntroStep } from './timeline';
import { useIntroAudio } from './useIntroAudio';
import { useIntroPreload } from './useIntroPreload';

/** Splash colour, capacitor.config.ts — the first intro frame must match it
 *  exactly so there is no colour flash between the native splash screen and
 *  this component's first paint. */
const SPLASH_BG = '#FFF6E4';

const FAST_SKIP_MS = 150;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface IntroSequenceProps {
  onComplete: () => void;
  testID?: string;
}

/**
 * The native opening sequence. Renders the five `IntroLayerId` layers from
 * `INTRO_TIMELINE`/`layers.ts` with Reanimated, deterministically: every
 * step is scheduled by `setTimeout` from a single `startedAt` timestamp
 * captured once preloading finishes, never by animation callbacks or
 * random values (phase-06-plan.md "The sequence is deterministic").
 */
export function IntroSequence({ onComplete, testID }: IntroSequenceProps) {
  const { width, height } = useDevice();
  const preloadReady = useIntroPreload();
  const reducedMotion = useTalkiReducedMotion();
  const { playBeat } = useIntroAudio();

  const bg = useSharedValue(0);
  const star = useSharedValue(0);
  const starGlow = useSharedValue(1);
  const sparkles = useSharedValue(0);
  const wordmark = useSharedValue(0);
  const secondary = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    onComplete();
  };

  const runStep = (step: IntroStep) => {
    playBeat(step);
    const target = step.action === 'exit' ? 0 : 1;
    switch (step.layer) {
      case 'background':
        if (step.action === 'exit') {
          containerOpacity.value = withTiming(0, { duration: step.durationMs });
        } else {
          bg.value = withTiming(target, { duration: step.durationMs });
        }
        break;
      case 'star':
        if (step.action === 'glow') {
          starGlow.value = withSequence(
            withTiming(1.08, { duration: step.durationMs / 2 }),
            withTiming(1, { duration: step.durationMs / 2 })
          );
        } else {
          star.value = withTiming(target, { duration: step.durationMs });
        }
        break;
      case 'sparkles':
        sparkles.value = withTiming(target, { duration: step.durationMs });
        break;
      case 'wordmark':
        wordmark.value = withTiming(target, { duration: step.durationMs });
        break;
      case 'secondary':
        secondary.value = withTiming(target, { duration: step.durationMs });
        break;
      default:
        break;
    }
  };

  const jumpToSettled = () => {
    // A raw `sv.value = 1` assignment (no animation) does not reliably
    // repaint react-native-web's CSS-driven style output the first time a
    // shared value changes before any `withTiming` has ever run on it —
    // observed directly: layers stayed at opacity 0 for the whole
    // reduced-motion hold. Routing through `withTiming` with a near-zero
    // duration goes through the same update path every other step in this
    // component already uses, and reads as instant to a human.
    [bg, star, sparkles, wordmark, secondary].forEach((sv) => {
      cancelAnimation(sv);
      sv.value = withTiming(1, { duration: 1 });
    });
    cancelAnimation(starGlow);
    starGlow.value = withTiming(1, { duration: 1 });
  };

  useEffect(() => {
    if (!preloadReady) return;

    if (reducedMotion) {
      // "Honour the OS reduce-motion setting: show the final frame and
      // move on" — the fully-settled frame appears with no animation at
      // all, then the sequence hands off shortly after.
      jumpToSettled();
      timers.current.push(setTimeout(finish, REDUCED_MOTION_INTRO_HOLD_MS));
      return () => timers.current.forEach(clearTimeout);
    }

    timers.current = INTRO_TIMELINE.map((step) => setTimeout(() => runStep(step), step.at));
    timers.current.push(setTimeout(finish, INTRO_TOTAL_MS));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadReady, reducedMotion]);

  const skip = () => {
    if (finishedRef.current) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    jumpToSettled();
    // Reanimated `SharedValue.value` is a mutable ref by design — assigning
    // it here and inside `runStep`'s `exit` branch (both reachable from the
    // same shared values) is the intended pattern, not the stale-closure
    // hazard this experimental rule guards against elsewhere.
    // eslint-disable-next-line react-hooks/immutability
    containerOpacity.value = withTiming(0, { duration: FAST_SKIP_MS });
    timers.current.push(setTimeout(finish, FAST_SKIP_MS));
  };

  // Legacy clamp()s, ported directly (index.html 429, 433): mascot
  // 118-196px at 32vw, wordmark 178-318px at 54vw — reused here as
  // fractions of device width so nothing clips at any of the ten
  // viewports, per the responsive module's contract.
  const mascotSize = clamp(width * 0.32, 118, 196);
  const wordmarkWidth = clamp(width * 0.54, 178, 318);
  const wordmarkHeight = wordmarkWidth * (136 / 440);
  const sparkleRadius = clamp(Math.min(width, height) * 0.14, 30, 70);
  const sparkleSize = clamp(Math.min(width, height) * 0.035, 8, 20);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const starStyle = useAnimatedStyle(() => ({
    opacity: star.value,
    transform: [{ translateY: (1 - star.value) * 24 }, { scale: 0.85 + star.value * 0.15 * starGlow.value }],
  }));
  const sparklesStyle = useAnimatedStyle(() => ({ opacity: sparkles.value }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * 14 }],
  }));
  const secondaryStyle = useAnimatedStyle(() => ({ opacity: secondary.value }));

  const sparkleAsset = INTRO_LAYER_ASSETS.sparkles;
  const secondaryAsset = INTRO_LAYER_ASSETS.secondary;

  return (
    <Animated.View testID={testID} style={[styles.root, { backgroundColor: SPLASH_BG }, containerStyle]}>
      <Pressable
        testID={testIds.intro.skipLayer}
        style={StyleSheet.absoluteFill}
        onPress={skip}
        accessibilityElementsHidden
      >
        <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} testID={testIds.intro.layer('background')}>
          {INTRO_LAYER_ASSETS.background.kind === 'image' && (
            <Image
              source={INTRO_LAYER_ASSETS.background.sources[0]}
              // `StyleSheet.absoluteFill` alone only sets
              // position/inset — react-native-web's `<Image>` still falls
              // back to the source asset's own registered width/height for
              // its layout box when nothing overrides them (confirmed
              // directly: the rendered `<img>` wrapper measured exactly
              // the PNG's intrinsic 1024x342, not the viewport, leaving a
              // blank splash-colour gap below it at any taller viewport).
              // Explicit 100% closes that gap on every device size.
              style={[StyleSheet.absoluteFill, styles.fill]}
              resizeMode="cover"
            />
          )}
          <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />
        </Animated.View>

        <View style={styles.stage} pointerEvents="none">
          <View style={[styles.mascotWrap, { width: mascotSize, height: mascotSize }]}>
            <Animated.Image
              testID={testIds.intro.layer('star')}
              source={INTRO_LAYER_ASSETS.star.kind === 'image' ? INTRO_LAYER_ASSETS.star.sources[0] : undefined}
              style={[{ width: mascotSize, height: mascotSize }, starStyle]}
              resizeMode="contain"
            />
            {sparkleAsset.kind === 'image' && (
              <Animated.View
                testID={testIds.intro.layer('sparkles')}
                style={[StyleSheet.absoluteFill, sparklesStyle]}
                pointerEvents="none"
              >
                {INTRO_SPARKLE_POINTS.map((point, i) => {
                  const rad = (point.angleDeg * Math.PI) / 180;
                  const dx = Math.cos(rad) * sparkleRadius * point.distance;
                  const dy = Math.sin(rad) * sparkleRadius * point.distance;
                  return (
                    <Image
                      key={i}
                      source={point.source}
                      resizeMode="contain"
                      style={{
                        position: 'absolute',
                        width: sparkleSize,
                        height: sparkleSize,
                        insetInlineStart: mascotSize / 2 + dx - sparkleSize / 2,
                        top: mascotSize / 2 + dy - sparkleSize / 2,
                      }}
                    />
                  );
                })}
              </Animated.View>
            )}
          </View>

          <Animated.View testID={testIds.intro.layer('wordmark')} style={wordmarkStyle}>
            {INTRO_LAYER_ASSETS.wordmark.kind === 'image' && (
              <Image
                source={INTRO_LAYER_ASSETS.wordmark.sources[0]}
                style={{ width: wordmarkWidth, height: wordmarkHeight }}
                resizeMode="contain"
              />
            )}
          </Animated.View>

          {secondaryAsset.kind === 'text' && (
            <Animated.View testID={testIds.intro.layer('secondary')} style={secondaryStyle}>
              <TalkiText align="center" weight="extrabold" color={v3.textSecondary}>
                {secondaryAsset.text}
              </TalkiText>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgOverlay: {
    backgroundColor: 'rgba(255,248,234,0.7)',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
