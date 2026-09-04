import { ScrollView, StyleSheet, View } from 'react-native';

import { TalkiCard, TalkiHeading, TalkiProgress, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { categoryProgress, hardestWords } from '@/domain/parent/report';
import { totalWords } from '@/domain/progress/totals';
import { useProgressStore } from '@/state/progressStore';
import { testIds } from '@/testing/testIds';

export function ReportTab() {
  const { learned, custom, stats } = useProgressStore();
  const rows = categoryProgress(learned, custom);
  const hard = hardestWords(stats, 10);

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" style={styles.fill}>
      <TalkiCard>
        <TalkiHeading level={3}>התקדמות לפי קטגוריה</TalkiHeading>
        {rows.map((r) => (
          <View key={r.id} testID={testIds.parent.reportCategory(r.id)} style={styles.row}>
            <View style={styles.lbl}>
              <TalkiText weight="bold">
                {r.icon} {r.title}
              </TalkiText>
              <TalkiText color={v3.textSecondary}>
                {r.done} מתוך {r.tot}
              </TalkiText>
            </View>
            <TalkiProgress value={r.tot ? r.done / r.tot : 0} />
          </View>
        ))}
        <TalkiText color={v3.textSecondary} style={styles.note}>
          סה״כ {learned.size} מילים מתוך {totalWords(custom)}.
        </TalkiText>
      </TalkiCard>
      <TalkiCard>
        <TalkiHeading level={3}>מילים שכדאי לחזור עליהן</TalkiHeading>
        <TalkiText color={v3.textSecondary}>המשחקים כבר מציגים אותן בתדירות גבוהה יותר.</TalkiText>
        {hard.length === 0 ? (
          <TalkiText color={v3.textSecondary} style={styles.note}>
            אין עדיין מילים קשות — הכול הולך חלק
          </TalkiText>
        ) : (
          hard.map((h, i) => (
            <View key={h.key} testID={testIds.parent.reportHard(i)} style={styles.hard}>
              <TalkiText weight="bold">{h.word}</TalkiText>
              <TalkiText color={v3.textSecondary}>{h.wrong} טעויות</TalkiText>
            </View>
          ))
        )}
      </TalkiCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { padding: 16, gap: 12, paddingBlockEnd: 32 },
  row: { gap: 6, marginBlockStart: 12 },
  lbl: { gap: 2 },
  note: { marginBlockStart: 12 },
  hard: { flexDirection: 'row', justifyContent: 'space-between', marginBlockStart: 8, minHeight: 40, alignItems: 'center' },
});
