import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeActivityGridProps {
  /** Exactly the children to place in the current page (typically ≤6). */
  children: ReactNode;
  columns?: 3;
  rows?: 2;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * 3×2 hub grid helper. Children are laid out row-major into a balanced grid.
 * Paging between pages of six is owned by the hub screen (Phase 21/22); this
 * primitive only sizes one page.
 */
export function LandscapeActivityGrid({
  children,
  columns = 3,
  rows = 2,
  style,
  testID,
}: LandscapeActivityGridProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const items = Array.isArray(children) ? children : [children];
  const cells = items.filter(Boolean);
  const rowsOut: ReactNode[][] = [];
  for (let r = 0; r < rows; r++) {
    rowsOut.push(cells.slice(r * columns, r * columns + columns));
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
          {/* Pad incomplete rows so remaining cells keep equal flex. */}
          {Array.from({ length: Math.max(0, columns - row.length) }).map((_, i) => (
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
