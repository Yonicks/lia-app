import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { useProgressStore } from '@/state/progressStore';
import { testIds } from '@/testing/testIds';

import { CustomWordForm } from '../components/CustomWordForm';

export function WordsTab() {
  const { custom, removeCustom } = useProgressStore();

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <TalkiCard>
        <CustomWordForm />
      </TalkiCard>
      <TalkiCard>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12, paddingBlockEnd: 32 },
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
