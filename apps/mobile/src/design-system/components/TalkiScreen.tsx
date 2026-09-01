import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { v3 } from '../theme/colors';

export interface TalkiScreenProps {
  children: ReactNode;
  testID?: string;
  /** index.html 184-205 — per-view background colour. Screens pass their own
   *  view's tint; defaults to the flat Home background. Full illustrated
   *  backgrounds are a screen-level concern (Phase 7+), not this primitive's. */
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * The one place RTL is applied to the DOM, app-wide. On web,
 * react-native-web's `View` forwards an explicit `dir` prop straight to the
 * underlying HTML element's `dir` attribute (not a style — RN's `ViewStyle`
 * has no `direction`/`writingDirection` field). The browser then cascades
 * that through ordinary CSS inheritance to every descendant, which is what
 * every logical style prop (`marginStart`, `insetInlineEnd`,
 * `textAlign: 'start'`, ...) resolves against — see
 * design-system/rtl/logical.ts. On native, RTL is app-wide via
 * `I18nManager.forceRTL()` (rtl/forceRTL.ts) and this prop is a no-op, so it
 * is only applied on web. Every top-level screen must render inside exactly
 * one `TalkiScreen`.
 */
export function TalkiScreen({ children, testID, backgroundColor = v3.bg, style }: TalkiScreenProps) {
  const webDirProp = Platform.OS === 'web' ? ({ dir: 'rtl' } as { dir: 'rtl' }) : {};
  return (
    <SafeAreaView
      testID={testID}
      style={[styles.root, { backgroundColor }, style]}
      {...webDirProp}
    >
      <View style={styles.content} {...webDirProp}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
