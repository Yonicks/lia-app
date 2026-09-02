import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { stickerFilterKeys } from '@/domain/rewards/stickerFilters';
import type { CategoryId } from '@/domain/types';
import { getCat } from '@/domain/vocabulary/allCats';
import { testIds } from '@/testing/testIds';

export function StickerFilters({
  active,
  onChange,
}: {
  active: 'all' | CategoryId;
  onChange: (key: 'all' | CategoryId) => void;
}) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.row}>
      {stickerFilterKeys().map((key) => {
        const label = key === 'all' ? 'הכל' : (getCat(key)?.title ?? key);
        return (
          <Pressable
            key={key}
            testID={testIds.stickers.filter(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active === key }}
            onPress={() => onChange(key)}
            style={[styles.chip, active === key && styles.on]}
          >
            <TalkiText weight="semibold">{label}</TalkiText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingInline: 16, paddingBlock: 8 },
  chip: {
    minHeight: 48,
    paddingInline: 14,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    justifyContent: 'center',
  },
  on: { borderColor: v3.purple600, backgroundColor: v3.surface },
});
