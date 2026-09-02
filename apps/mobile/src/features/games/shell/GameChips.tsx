import { StyleSheet, View } from 'react-native';

import { TalkiPill } from '@/design-system/components';
import { testIds } from '@/testing/testIds';

export interface GameChipsProps {
  chips: string[];
  chipTestIDs?: (string | undefined)[];
}

export function GameChips({ chips, chipTestIDs }: GameChipsProps) {
  return (
    <View style={styles.row}>
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
    gap: 8,
    paddingInline: 14,
    justifyContent: 'center',
  },
});
