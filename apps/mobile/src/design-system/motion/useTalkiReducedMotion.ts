import { useReducedMotion } from 'react-native-reanimated';

/**
 * Single preference path for Talki landscape animations.
 *
 * Reads the OS reduce-motion / prefer-reduced-motion setting through
 * Reanimated (works on native + web). Feature code should call this
 * instead of importing `useReducedMotion` directly so policy stays
 * centralized.
 */
export function useTalkiReducedMotion(): boolean {
  return Boolean(useReducedMotion());
}
