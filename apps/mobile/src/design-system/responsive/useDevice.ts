import { useWindowDimensions } from 'react-native';

import { classifyDevice, classifyOrientation, type DeviceClass, type Orientation } from './breakpoints';

export interface DeviceInfo {
  width: number;
  height: number;
  deviceClass: DeviceClass;
  orientation: Orientation;
}

/**
 * The only sanctioned way for a component to know its size class. Backed by
 * `useWindowDimensions`, which re-renders on rotation, unlike a one-shot
 * `Dimensions.get()` read — see phase-05-plan.md "Responsive is centralised,
 * not per-component".
 */
export function useDevice(): DeviceInfo {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    deviceClass: classifyDevice(width),
    orientation: classifyOrientation(width, height),
  };
}
