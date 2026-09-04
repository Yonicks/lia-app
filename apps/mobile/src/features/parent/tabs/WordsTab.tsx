import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { useProgressStore } from '@/state/progressStore';
import { testIds } from '@/testing/testIds';

import { CustomWordForm } from '../components/CustomWordForm';

/**
 * Custom words tab — landscape (Phase 27).
 * Tablets: form | list side-by-side. Phones: stacked ScrollView (adult scroll OK).
 */
export function WordsTab() {
  const { custom, removeCustom } = useProgressStore();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const split = layout.deviceClass === 'tablet' || layout.deviceClass === 'largeTablet';

  const list = (
    <TalkiCard style={styles.flexCard}>
      <TalkiHeading level={3}>המילים שלי ({custom.length})</TalkiHeading>
      {custom.length === 0 ? (
        <TalkiText color={v3.textSecondary}>עוד לא הוספתם מילים אישיות.</TalkiText>
      ) : (
        custom.map((c) => (
          <View key={c.id} testID={testIds.parent.wordsItem(c.id ?? '')} style={styles.item}>
            <TalkiText weight="bold">
              {c.emoji} {c.word}
            </TalkiText>
            <Pressable
              testID={testIds.parent.wordsDelete(c.id ?? '')}
              accessibilityRole="button"
              accessibilityLabel="מחיקה"
              onPress={() => {
                if (c.id) void removeCustom(c.id);
              }}
              style={styles.del}
            >
              <TalkiText>מחיקה</TalkiText>
            </Pressable>
          </View>
        ))
      )}
      <Pressable testID={testIds.parent.wordsAdd} accessibilityRole="button" style={styles.hidden} />
    </TalkiCard>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.pad, split && styles.padSplit, { gap: tokens.gap }]}
      keyboardShouldPersistTaps="handled"
      style={styles.fill}
    >
      <TalkiCard style={split ? styles.flexCard : undefined}>
        <CustomWordForm />
      </TalkiCard>
      {list}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { padding: 12, paddingBlockEnd: 48 },
  padSplit: { flexDirection: 'row', alignItems: 'flex-start' },
  flexCard: { flex: 1, minWidth: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginBlockStart: 8,
  },
  del: { minHeight: 48, minWidth: 48, justifyContent: 'center', paddingInline: 8 },
  hidden: { height: 0, overflow: 'hidden' },
});
