import type { ReactNode } from 'react';
import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { useLandscapeLayout } from '../responsive/useLandscapeLayout';
import type { FocalPoint, LandscapeWorldId } from './backgrounds';
import { LandscapeScreen } from './LandscapeScreen';
import { LandscapeWorldBackground } from './LandscapeWorldBackground';
import { landscapeTokens, type LandscapeShellVariant } from './tokens';

export interface LandscapeWorldShellProps {
  /** Composition family — slots stay the same; callers fill differently. */
  variant: LandscapeShellVariant;
  world?: LandscapeWorldId;
  backgroundSource?: ImageSourcePropType;
  backgroundFocal?: FocalPoint;
  topBar?: ReactNode;
  /** Optional centered title band under/over the top bar (Games/Practice). */
  titleSlot?: ReactNode;
  sideNavStart?: ReactNode;
  sideNavEnd?: ReactNode;
  /** Main content (hero + strip, or 3×2 grid, etc.). */
  children?: ReactNode;
  /** Optional bottom/edge auxiliary region (e.g. page indicator). */
  auxiliary?: ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared landscape world shell — one architecture for phones and tablets.
 *
 * Owns: world background, safe-area padding, top utility region, optional
 * logo/title placements, optional start/end side-nav lanes, main content
 * bounds, optional auxiliary edge region, overflow:hidden on the root so
 * hubs stay viewport-bound (no portrait-like vertical page).
 *
 * Does not hard-code Home/Games/Practice coordinates — those phases fill
 * the slots. This phase only proves the slots compose.
 */
export function LandscapeWorldShell({
  variant,
  world,
  backgroundSource,
  backgroundFocal,
  topBar,
  titleSlot,
  sideNavStart,
  sideNavEnd,
  children,
  auxiliary,
  testID,
  style,
  contentStyle,
}: LandscapeWorldShellProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const hasSideStart = Boolean(sideNavStart);
  const hasSideEnd = Boolean(sideNavEnd);
  const worldId: LandscapeWorldId =
    world ?? (variant === 'games' || variant === 'practice' || variant === 'home' ? variant : 'home');

  return (
    <LandscapeScreen testID={testID} edgesHandledByShell style={StyleSheet.flatten(style)}>
      {backgroundSource ? (
        <LandscapeWorldBackground
          source={backgroundSource}
          world={worldId}
          deviceClass={layout.deviceClass}
          focal={backgroundFocal}
          testID={testID ? `${testID}-bg` : undefined}
        />
      ) : null}

      <View
        style={[
          styles.safe,
          {
            paddingTop: layout.safeInsets.top,
            paddingBottom: layout.safeInsets.bottom,
            // Physical safe-area edges — notch/home-indicator sit on physical
            // sides regardless of RTL text direction.
            // eslint-disable-next-line no-restricted-syntax
            paddingLeft: layout.safeInsets.left,
            // eslint-disable-next-line no-restricted-syntax
            paddingRight: layout.safeInsets.right,
          },
        ]}
      >
        {topBar ? <View style={[styles.topBar, { minHeight: tokens.topBarMinHeight }]}>{topBar}</View> : null}
        {titleSlot ? <View style={styles.titleSlot}>{titleSlot}</View> : null}

        <View style={styles.body}>
          {hasSideStart ? (
            <View style={[styles.sideLane, { width: tokens.sideNavLane }]}>{sideNavStart}</View>
          ) : null}

          <View
            style={[
              styles.content,
              {
                paddingInline: tokens.padInline,
                paddingBlock: tokens.padBlock,
              },
              contentStyle,
            ]}
          >
            {children}
          </View>

          {hasSideEnd ? (
            <View style={[styles.sideLane, { width: tokens.sideNavLane }]}>{sideNavEnd}</View>
          ) : null}
        </View>

        {auxiliary ? <View style={styles.auxiliary}>{auxiliary}</View> : null}
      </View>
    </LandscapeScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    overflow: 'hidden',
  },
  topBar: {
    zIndex: 2,
    justifyContent: 'center',
  },
  titleSlot: {
    zIndex: 2,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 0,
  },
  sideLane: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    zIndex: 1,
  },
  auxiliary: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
