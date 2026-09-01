import { Image, Pressable, StyleSheet, View } from 'react-native';

import { brand, uiIcons } from '@/design-system/assets';
import { TalkiIconButton, TalkiText } from '@/design-system/components';
import { shadowTopbar } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { barHeight, homePaddingInline } from '@/design-system/theme/spacing';
import { useDevice } from '@/design-system/responsive/useDevice';

export interface TopBarProps {
  /** index.html 1303-1306 (`tb-points`) — the child's running score, shown
   *  as a star icon plus a bold number. Legacy sets `.tb-points b{direction:
   *  ltr}` so a multi-digit count never re-shapes under the RTL context;
   *  `TalkiText`'s `writingDirection` prop reproduces that directly on the
   *  number `Text`, not the whole pill. */
  points: number;
  musicOn: boolean;
  onToggleMusic: () => void;
  /** Long-press-to-open, index.html 1308 (`tb-brand-btn`) — the trigger only;
   *  the gate itself is `ParentGate`. */
  onBrandLongPress?: () => void;
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
export function TopBar({ points, musicOn, onToggleMusic, onBrandLongPress, testID }: TopBarProps) {
  const { deviceClass } = useDevice();
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
          testID="topbar-brand"
          onLongPress={onBrandLongPress}
          accessibilityRole="button"
          accessibilityLabel="מסך הורים (לחיצה ארוכה)"
          style={styles.brandButton}
        >
          <Image source={brand.headerLogo} style={styles.logo} resizeMode="contain" />
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
