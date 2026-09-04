import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { v3 } from '../theme/colors';

export interface LandscapeScreenProps {
  children: ReactNode;
  testID?: string;
  /** Fallback fill when no world background is painted underneath. */
  backgroundColor?: string;
  style?: ViewStyle;
  /** When true, skip SafeAreaView (shell already owns safe-area padding). */
  edgesHandledByShell?: boolean;
}

/**
 * RTL root for landscape compositions. Mirrors TalkiScreen's web `dir="rtl"`
 * contract so logical start/end props resolve correctly on the Expo web
 * test surface. Does not paint a world background — that is
 * LandscapeWorldShell's job.
 */
export function LandscapeScreen({
  children,
  testID,
  backgroundColor = v3.bg,
  style,
  edgesHandledByShell = false,
}: LandscapeScreenProps) {
  const webDirProp = Platform.OS === 'web' ? ({ dir: 'rtl' } as { dir: 'rtl' }) : {};
  if (edgesHandledByShell) {
    return (
      <View testID={testID} style={[styles.root, { backgroundColor }, style]} {...webDirProp}>
        {children}
      </View>
    );
  }
  return (
    <SafeAreaView testID={testID} style={[styles.root, { backgroundColor }, style]} {...webDirProp}>
      <View style={styles.content} {...webDirProp}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
