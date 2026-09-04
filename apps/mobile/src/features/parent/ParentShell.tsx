import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LandscapeScreen, landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';

export interface ParentShellProps {
  children: ReactNode;
  testID?: string;
  /** Optional header band (back + title / gate chrome). */
  header?: ReactNode;
  /** Optional tab strip under the header. */
  tabs?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared landscape Parent Center / gate frame (Phase 27).
 *
 * Adult density: LandscapeScreen + Talki brand colors — no toddler world
 * background. KeyboardAvoidingView + bounded content width so forms remain
 * usable with a landscape software keyboard. Safe areas via LandscapeScreen.
 */
export function ParentShell({ children, testID, header, tabs, style, contentStyle }: ParentShellProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);

  return (
    <LandscapeScreen testID={testID} backgroundColor={v3.bg} style={StyleSheet.flatten(style)}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {header ? <View style={styles.header}>{header}</View> : null}
        {tabs ? <View style={styles.tabs}>{tabs}</View> : null}
        <View
          style={[
            styles.content,
            {
              paddingInline: tokens.padInline,
              maxWidth: tokens.parentContentMaxWidth,
              alignSelf: 'center',
              width: '100%',
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </LandscapeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },
  header: { zIndex: 2 },
  tabs: { zIndex: 2 },
  content: { flex: 1, minHeight: 0, minWidth: 0 },
});
