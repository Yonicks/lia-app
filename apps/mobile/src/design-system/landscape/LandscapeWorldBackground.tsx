import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import {
  focalToContentPosition,
  landscapeBgFocalFor,
  type FocalPoint,
  type LandscapeWorldId,
} from './backgrounds';
import type { DeviceClass } from '../responsive/breakpoints';

export interface LandscapeWorldBackgroundProps {
  source: ImageSourcePropType;
  world: LandscapeWorldId;
  deviceClass: DeviceClass;
  /** Override the registered focal point when a screen needs a custom crop. */
  focal?: FocalPoint;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Full-bleed world layer: cover crop, never stretch. Focal point is applied
 * via expo-image `contentPosition` so phone 16:9 and tablet 4:3 keep the
 * story focus (path / meadow / castle) rather than dead-centering the frame.
 */
export function LandscapeWorldBackground({
  source,
  world,
  deviceClass,
  focal,
  style,
  testID,
}: LandscapeWorldBackgroundProps) {
  const point = focal ?? landscapeBgFocalFor(world, deviceClass);
  return (
    <View testID={testID} pointerEvents="none" style={[styles.fill, style]}>
      <Image
        source={source}
        style={styles.image}
        contentFit="cover"
        contentPosition={focalToContentPosition(point)}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
