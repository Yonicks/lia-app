import { StyleSheet, View } from 'react-native';

import { TalkiPill } from '@/design-system/components';
import { testIds } from '@/testing/testIds';

export interface GameChipsProps {
  chips: string[];
  chipTestIDs?: (string | undefined)[];
  /** Token-driven gap from GameShell; defaults keep legacy spacing. */
  gap?: number;
}

export function GameChips({ chips, chipTestIDs, gap = 8 }: GameChipsProps) {
  if (chips.length === 0) return null;
  return (
    <View style={[styles.row, { gap }]}>
      {chips.map((label, index) => (
        <TalkiPill
          key={`${index}:${label}`}
          testID={chipTestIDs?.[index] ?? testIds.game.chip(index)}
          label={label}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
