import { useWindowDimensions } from 'react-native';

import {
  classifyDeviceClass,
  classifyOrientation,
  longEdgeOf,
  shortEdgeOf,
  type DeviceClass,
  type Orientation,
} from './breakpoints';

export interface DeviceInfo {
  width: number;
  height: number;
  shortEdge: number;
  longEdge: number;
  aspectRatio: number;
  deviceClass: DeviceClass;
  orientation: Orientation;
}

/**
 * The only sanctioned way for a component to know its size class. Backed by
 * `useWindowDimensions`, which re-renders on rotation, unlike a one-shot
 * `Dimensions.get()` read — see phase-05-plan.md "Responsive is centralised,
 * not per-component". `deviceClass` is derived from the short edge (see
 * breakpoints.ts), so a landscape phone classifies as a phone regardless of
 * how wide its long edge happens to be.
 */
export function useDevice(): DeviceInfo {
  const { width, height } = useWindowDimensions();
  const shortEdge = shortEdgeOf(width, height);
  const longEdge = longEdgeOf(width, height);
  return {
    width,
    height,
    shortEdge,
    longEdge,
    aspectRatio: longEdge / shortEdge,
    deviceClass: classifyDeviceClass(shortEdge),
    orientation: classifyOrientation(width, height),
  };
}
