import { useEffect, useRef } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { brand, uiIcons } from '@/design-system/assets';
import { TalkiIconButton, TalkiText } from '@/design-system/components';
import { PARENT_HOLD_MOVE_PX, PARENT_HOLD_MS } from '@/domain/parent/gate';
import { shadowTopbar } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { barHeight, homePaddingInline } from '@/design-system/theme/spacing';
import { useDevice } from '@/design-system/responsive/useDevice';
import { testIds } from '@/testing/testIds';

export interface TopBarProps {
  /** index.html 1303-1306 (`tb-points`) — the child's running score, shown
   *  as a star icon plus a bold number. Legacy sets `.tb-points b{direction:
   *  ltr}` so a multi-digit count never re-shapes under the RTL context;
   *  `TalkiText`'s `writingDirection` prop reproduces that directly on the
   *  number `Text`, not the whole pill. */
  points: number;
  musicOn: boolean;
  onToggleMusic: () => void;
  /** 900 ms hold, index.html 4050-4058. A short tap toasts via onBrandShortPress. */
  onBrandLongPress?: () => void;
  onBrandShortPress?: () => void;
  testID?: string;
}

/**
 * index.html 1300-1316 (`.topbar`) — score at inline-start, a single music
 * toggle at inline-end, brand mark centred on the viewport rather than
 * between the two side groups, so the two side groups can differ in width
 * without nudging the logo (index.html 101-103). Minimum height 68
 * preserved exactly (`barHeight`, theme/spacing.ts).
 *
 * Deliberately just one utility button, matching current `index.html`
 * exactly: `docs/talki-home-redesign-plan.md` proposes a future three-button
 * topbar (gift/music/speech-rate) but that redesign is not implemented in
 * `index.html` today, and per the phase's standing rule the code — not an
 * aspirational doc — is the source of truth.
 */
export function TopBar({
  points,
  musicOn,
  onToggleMusic,
  onBrandLongPress,
  onBrandShortPress,
  testID,
}: TopBarProps) {
  const { deviceClass } = useDevice();
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
    // Web only: cancel the hold if the pointer drags away (Playwright parent.spec).
    // Native `window` exists but has no DOM addEventListener — calling it crashes.
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

  return (
    <View
      testID={testID}
      style={[
        styles.bar,
        shadowTopbar,
        { minHeight: barHeight, paddingInline: homePaddingInline(deviceClass) },
      ]}
    >
      <View
        testID="topbar-points"
        style={styles.pointsPill}
        accessibilityRole="image"
        accessibilityLabel={`${points} נקודות שנצברו`}
      >
        <Image source={uiIcons.star} style={styles.pointsIcon} resizeMode="contain" />
        <TalkiText weight="extrabold" style={{ writingDirection: 'ltr' }}>
          {points}
        </TalkiText>
      </View>
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
            <Image source={brand.headerLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </Pressable>
      </View>
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
    paddingBlock: 8,
    backgroundColor: v3.bg,
    borderBottomWidth: 1,
    borderBottomColor: v3.borderSoft,
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
  pointsIcon: {
    width: 24,
    height: 24,
  },
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
  logo: {
    width: 120,
    height: 40,
  },
  utils: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
