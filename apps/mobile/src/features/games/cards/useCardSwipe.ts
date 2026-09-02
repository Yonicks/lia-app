import { Gesture } from 'react-native-gesture-handler';

/**
 * Constrained to the flashcard (not the full screen) so it does not fight
 * the iOS edge-back gesture. Threshold matches legacy `Math.abs(dx)>50`
 * (index.html 3474): visual right → previous, visual left → next.
 */
export function useCardSwipe(onStep: (delta: -1 | 1) => void) {
  return Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX > 50) onStep(-1);
      else if (e.translationX < -50) onStep(1);
    });
}
