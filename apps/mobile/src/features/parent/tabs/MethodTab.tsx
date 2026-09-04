import { ScrollView, StyleSheet, View } from 'react-native';

import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';

const ITEMS: [string, string, string][] = [
  [
    '🎯 מילה במיקוד',
    'גירוי ממוקד (Focused stimulation)',
    'מילת יעד אחת מודגמת 8 פעמים במשפטים קצרים וטבעיים, במקום חזרה יבשה. במחקרים על "מאחרי דיבור" הילדים הפיקו יותר מילות יעד ויותר צירופים.',
  ],
  [
    '👈 תראי לי',
    'זיהוי לפני הפקה',
    'הבנה מקדימה את הדיבור. המשחק לא דורש מילה — רק הצבעה, ומעלה את מספר האפשרויות משתיים לשלוש ואז לארבע, רק אחרי שלוש הצלחות ברצף.',
  ],
  [
    '⏸️ משלימים ביחד',
    'השהיה צפויה + Cloze',
    'משפט מוכר נעצר מילה לפני הסוף, ואז חמש שניות שקט עם פרצוף מצפה. אם אין תגובה — מודגמת התשובה בלי לחץ.',
  ],
  [
    '🫙 הצנצנת',
    'פיתוי לתקשורת (Communication temptation)',
    'חפץ נחשק שדורש יוזמה כדי לקבל אותו. כל ניסיון נחשב: מילה, הברה, קול או לחיצה — בדיוק כמו בהנחיה לענות לכל ניסיון תקשורתי.',
  ],
  [
    '👂 דומה אבל לא',
    'זוגות מינימליים',
    'עֵץ/עֵז, יָד/יָם — הבחנה בין מילים שנבדלות בצליל אחד, בשלב התפיסה (האזנה) שקודם להפקה. טעות מלווה בהסבר קולי מה נשמע ומה נאמר.',
  ],
  [
    '➕ שתי מילים',
    'הרחבה וקשרים סמנטיים מוקדמים',
    '"עוד", "אין", "גדול", "שלי" — הקשרים שמופיעים ראשונים בצירופי שתי מילים. כל בחירה מוחזרת מורחבת למשפט מלא (recast/expansion).',
  ],
];

export function MethodTab() {
  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled" style={styles.fill}>
      <TalkiCard>
        <TalkiHeading level={3}>על מה מבוססים משחקי הדיבור</TalkiHeading>
        {ITEMS.map(([title, tech, desc]) => (
          <View key={title} style={styles.row}>
            <TalkiText weight="extrabold">{title}</TalkiText>
            <TalkiText color={v3.textSecondary} weight="bold">
              {tech}
            </TalkiText>
            <TalkiText color={v3.textSecondary}>{desc}</TalkiText>
          </View>
        ))}
        <TalkiText color={v3.textSecondary} style={styles.note}>
          שלוש הנחיות שחוזרות בכל הגישות: לדבר קצר ואיטי, לחכות בשקט אחרי כל הזדמנות, ולהחזיר כל ניסיון של הילד כמשפט
          מלא. האפליקציה עוזרת לתרגל — היא לא מחליפה קלינאית תקשורת, ואם יש חשש לעיכוב שפתי כדאי להיבדק.
        </TalkiText>
      </TalkiCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { padding: 16, gap: 12, paddingBlockEnd: 32 },
  row: { gap: 4, marginBlockStart: 12 },
  note: { marginBlockStart: 12 },
});
