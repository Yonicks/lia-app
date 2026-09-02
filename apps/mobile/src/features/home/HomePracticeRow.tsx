import { Image, StyleSheet, View } from 'react-native';

import { practiceIcons, uiIcons } from '@/design-system/assets';
import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { HOME_PRACTICE_HOME } from '@/domain/practice/list';
import type { PracticeModeId } from '@/domain/types';
import { testIds } from '@/testing/testIds';

export interface HomePracticeRowProps {
  onOpen: (id: PracticeModeId) => void;
  onOpenAll: () => void;
}

const VARIANT_BG: Record<string, string> = {
  pink: '#FFC8DD',
  lavender: '#DED3FF',
  orange: '#FFD5AA',
};

const VARIANT_ICON: Record<string, (typeof practiceIcons)[keyof typeof practiceIcons]> = {
  focus: practiceIcons.focus,
  receptive: practiceIcons.receptive,
  cloze: practiceIcons.cloze,
};

/**
 * index.html `renderHome()`'s "תרגול דיבור" section — exactly
 * `HOME_PRACTICE_HOME` (focus, receptive, cloze), plus `homeAllLink()` to
 * the full practice menu. Real Talki speech icons, never emoji (index.html
 * 1378-1382).
 */
export function HomePracticeRow({ onOpen, onOpenAll }: HomePracticeRowProps) {
  return (
    <View testID={testIds.home.sectionPractice}>
      <View style={styles.headerRow}>
        <View style={styles.headingGroup}>
          <Image source={practiceIcons.bubble} style={styles.headingIcon} resizeMode="contain" />
          <TalkiHeading level={2}>תרגול דיבור</TalkiHeading>
        </View>
        <TalkiCard testID={testIds.home.allPractice} onPress={onOpenAll} style={styles.allLink}>
          <TalkiText weight="bold">הכל</TalkiText>
        </TalkiCard>
      </View>
      <View style={styles.row}>
        {HOME_PRACTICE_HOME.map((card) => (
          <TalkiCard
            key={card.id}
            testID={testIds.home.practice(card.id)}
            onPress={() => onOpen(card.id)}
            style={[styles.card, { backgroundColor: VARIANT_BG[card.variant] ?? v3.surface }]}
          >
            <Image source={VARIANT_ICON[card.id] ?? uiIcons.star} style={styles.icon} resizeMode="contain" />
            <TalkiHeading level={3}>{card.title}</TalkiHeading>
            <TalkiText color={v3.textSecondary} style={styles.desc}>
              {card.description}
            </TalkiText>
          </TalkiCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingIcon: {
    width: 25,
    height: 25,
  },
  allLink: {
    minHeight: 48,
    minWidth: 48,
    paddingBlock: 8,
    paddingInline: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 150,
    gap: 6,
  },
  icon: {
    width: 48,
    height: 48,
  },
  desc: {
    fontSize: 13,
  },
});
