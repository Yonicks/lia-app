import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeWordGridProps {
  /** Exactly the children to place in the current page. */
  children: ReactNode;
  /** Defaults to landscapeTokens.wordGridColumns for the active device class. */
  columns?: number;
  /** Defaults to landscapeTokens.wordGridRows for the active device class. */
  rows?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Landscape vocabulary word grid — row-major cells sized from centralized
 * tokens. Paging between pages is owned by CategoryScreen; this primitive
 * only lays out one viewport-bound page (no portrait-like vertical wrap).
 */
export function LandscapeWordGrid({
  children,
  columns,
  rows,
  style,
  testID,
}: LandscapeWordGridProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const cols = columns ?? tokens.wordGridColumns;
  const rowCount = rows ?? tokens.wordGridRows;
  const items = Array.isArray(children) ? children : [children];
  const cells = items.filter(Boolean);
  const rowsOut: ReactNode[][] = [];
  for (let r = 0; r < rowCount; r++) {
    rowsOut.push(cells.slice(r * cols, r * cols + cols));
  }

  return (
    <View testID={testID} style={[styles.grid, { gap: tokens.gap }, style]}>
      {rowsOut.map((row, ri) => (
        <View key={`row-${ri}`} style={[styles.row, { gap: tokens.gap }]}>
          {row.map((cell, ci) => (
            <View key={`cell-${ri}-${ci}`} style={styles.cell}>
              {cell}
            </View>
          ))}
          {Array.from({ length: Math.max(0, cols - row.length) }).map((_, i) => (
            <View key={`pad-${ri}-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
  },
});
