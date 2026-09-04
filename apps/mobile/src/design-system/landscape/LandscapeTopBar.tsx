import { useEffect, useRef, type ReactNode } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { brand, uiIcons } from '@/design-system/assets';
import { TalkiIconButton, TalkiText } from '@/design-system/components';
import { PARENT_HOLD_MOVE_PX, PARENT_HOLD_MS } from '@/domain/parent/gate';
import { shadowSm } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { testIds } from '@/testing/testIds';

import { landscapeTokens } from './tokens';

export interface LandscapeTopBarProps {
  points: number;
  musicOn: boolean;
  onToggleMusic: () => void;
  onBrandLongPress?: () => void;
  onBrandShortPress?: () => void;
  /** When set, the points pill opens Rewards (Phase 19). Display-only when unset. */
  onPointsPress?: () => void;
  /** Override points control testID (defaults to `${testID}-points`). */
  pointsTestID?: string;
  /** Optional profile/settings control (reference shows a separate parent icon). */
  onProfilePress?: () => void;
  showLogo?: boolean;
  /** Extra start-side node (rarely needed). */
  startAccessory?: ReactNode;
  testID?: string;
  logoSource?: ImageSourcePropType;
}

/**
 * Landscape top chrome: points pill, optional centered logo, music (+ optional
 * profile). Parent hold matches legacy TopBar (900 ms) so Phase 19 can swap
 * chrome without changing the gate contract. Brand uses the same absolute
 * center slot as TopBar so Playwright parent-hold coordinates stay valid.
 */
export function LandscapeTopBar({
  points,
  musicOn,
  onToggleMusic,
  onBrandLongPress,
  onBrandShortPress,
  onPointsPress,
  pointsTestID,
  onProfilePress,
  showLogo = true,
  startAccessory,
  testID,
  logoSource = brand.headerLogo,
}: LandscapeTopBarProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const hold = useRef({
    x: 0,
    y: 0,
    timer: null as ReturnType<typeof setTimeout> | null,
    fired: false,
    down: false,
    unlisten: null as (() => void) | null,
  });

  const cancelHold = () => {
    if (hold.current.timer) clearTimeout(hold.current.timer);
    hold.current.timer = null;
    hold.current.unlisten?.();
    hold.current.unlisten = null;
  };

  const startHold = (x: number, y: number) => {
    hold.current.fired = false;
    hold.current.down = true;
    hold.current.x = x;
    hold.current.y = y;
    cancelHold();
    hold.current.down = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const onMove = (ev: MouseEvent | PointerEvent) => {
        const moved =
          Math.hypot(ev.pageX - hold.current.x, ev.pageY - hold.current.y) > PARENT_HOLD_MOVE_PX ||
          Math.abs(ev.movementX) > PARENT_HOLD_MOVE_PX ||
          Math.abs(ev.movementY) > PARENT_HOLD_MOVE_PX;
        if (moved) {
          hold.current.down = false;
          cancelHold();
        }
      };
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('mousemove', onMove, true);
      hold.current.unlisten = () => {
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('mousemove', onMove, true);
      };
    }
    hold.current.timer = setTimeout(() => {
      hold.current.fired = true;
      hold.current.timer = null;
      hold.current.down = false;
      hold.current.unlisten?.();
      hold.current.unlisten = null;
      onBrandLongPress?.();
    }, PARENT_HOLD_MS);
  };

  const onHoldMove = (pageX: number, pageY: number) => {
    if (!hold.current.down || hold.current.fired) return;
    if (Math.hypot(pageX - hold.current.x, pageY - hold.current.y) > PARENT_HOLD_MOVE_PX) {
      hold.current.down = false;
      cancelHold();
    }
  };

  useEffect(() => () => cancelHold(), []);

  const resolvedPointsId = pointsTestID ?? (testID ? `${testID}-points` : 'topbar-points');

  return (
    <View
      testID={testID}
      style={[styles.bar, { minHeight: tokens.topBarMinHeight, paddingInline: tokens.padInline }]}
    >
      <View style={styles.sideGroup}>
        {startAccessory}
        {onPointsPress ? (
          <Pressable
            testID={resolvedPointsId}
            onPress={onPointsPress}
            accessibilityRole="button"
            accessibilityLabel={`${points} נקודות שנצברו — פתח פרסים`}
            style={[styles.pointsPill, styles.pointsPressable, shadowSm]}
          >
            <Image source={uiIcons.star} style={styles.pointsIcon} resizeMode="contain" />
            <TalkiText weight="extrabold" style={{ writingDirection: 'ltr' }}>
              {points}
            </TalkiText>
          </Pressable>
        ) : (
          <View
            testID={resolvedPointsId}
            style={[styles.pointsPill, shadowSm]}
            accessibilityRole="image"
            accessibilityLabel={`${points} נקודות שנצברו`}
          >
            <Image source={uiIcons.star} style={styles.pointsIcon} resizeMode="contain" />
            <TalkiText weight="extrabold" style={{ writingDirection: 'ltr' }}>
              {points}
            </TalkiText>
          </View>
        )}
        {onProfilePress ? (
          <TalkiIconButton
            testID={testID ? `${testID}-profile` : undefined}
            icon={uiIcons.settings}
            onPress={onProfilePress}
            accessibilityLabel="פרופיל והורים"
          />
        ) : null}
      </View>

      {showLogo ? (
        <View pointerEvents="box-none" style={styles.brandSlot}>
          <Pressable
            testID={testIds.parent.button}
            accessibilityRole="button"
            accessibilityLabel="מסך הורים (לחיצה ארוכה)"
            style={styles.brandButton}
            onPressIn={(e) => startHold(e.nativeEvent.pageX, e.nativeEvent.pageY)}
            onTouchMove={(e) => {
              const t = e.nativeEvent.touches[0];
              if (t) onHoldMove(t.pageX, t.pageY);
            }}
            onPressOut={() => {
              if (!hold.current.fired) {
                hold.current.down = false;
                cancelHold();
              }
            }}
            onPress={() => {
              if (!hold.current.fired) onBrandShortPress?.();
            }}
          >
            <View testID="topbar-brand" pointerEvents="none">
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.utils}>
        <TalkiIconButton
          testID="topbar-music"
          icon={uiIcons.music}
          active={musicOn}
          onPress={onToggleMusic}
          accessibilityLabel={musicOn ? 'כבה מוזיקה' : 'הפעל מוזיקה'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBlock: 4,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingInline: 12,
    borderRadius: 18,
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: v2.line,
  },
  pointsPressable: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
  },
  pointsIcon: { width: 22, height: 22 },
  brandSlot: {
    position: 'absolute',
    insetBlock: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 110, height: 36 },
  utils: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
});
