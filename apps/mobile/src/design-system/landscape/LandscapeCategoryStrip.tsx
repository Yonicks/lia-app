import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeCategoryStripProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One-row horizontal category strip. Horizontal scroll preserves reachability
 * when more categories exist than fit the first viewport (AGENTS.md #21).
 */
export function LandscapeCategoryStrip({ children, style, testID }: LandscapeCategoryStripProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);

  return (
    <View testID={testID} style={[styles.wrap, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, { gap: tokens.gap, paddingInline: 2 }]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBlock: 4,
  },
});
