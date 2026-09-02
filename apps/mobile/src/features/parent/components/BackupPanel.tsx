import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { backupService } from '@/services/backup';
import { downloadBackupJson, pickBackupJsonFile } from '@/services/backup/shareBackup';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

const REPLACE_WARNING = 'מיזוג מוסיף לקיים, החלפה מוחקת הכול קודם';

export function BackupPanel() {
  const { settings, hydrate } = useSettingsStore();
  const rehydrateProgress = useProgressStore((s) => s.hydrate);
  const [status, setStatus] = useState<string | null>(null);

  const last = settings.lastBackup
    ? `גיבוי אחרון: ${new Date(settings.lastBackup).toLocaleDateString('he-IL')}`
    : 'עוד לא גובה';

  const onExport = async () => {
    const payload = await backupService.exportV1();
    downloadBackupJson(payload);
    await hydrate();
    setStatus('הגיבוי יוצא');
  };

  const onImport = async (mode: 'merge' | 'replace') => {
    const stub =
      typeof window !== 'undefined'
        ? (window as unknown as { __talkiBackupJson?: string }).__talkiBackupJson
        : undefined;
    const raw = stub ?? (await pickBackupJsonFile());
    if (!raw) return;
    const result = await backupService.importV1(raw, mode);
    await Promise.all([hydrate(), rehydrateProgress()]);
    setStatus(result.imported ? `יובאו ${result.imported} פריטים` : 'הייבוא לא הצליח');
  };

  return (
    <View>
      <TalkiHeading level={3}>גיבוי ושחזור</TalkiHeading>
      <TalkiText color={v3.textSecondary}>
        הכול נשמר על המכשיר הזה בלבד. קובץ גיבוי אחד מכיל את ההתקדמות, ההגדרות, המילים האישיות וכל ההקלטות.
      </TalkiText>
      <TalkiText testID={testIds.parent.settingsLastBackup} color={v3.textSecondary} style={styles.gap}>
        {last}
      </TalkiText>
      <TalkiButton testID={testIds.parent.settingsExport} label="ייצוא" onPress={() => void onExport()} />
      <TalkiText testID={testIds.parent.settingsImport} color={v3.textSecondary} style={styles.gap}>
        {REPLACE_WARNING}
      </TalkiText>
      <View style={styles.row}>
        <TalkiButton
          testID={testIds.parent.settingsImportMerge}
          label="מיזוג"
          variant="secondary"
          onPress={() => void onImport('merge')}
        />
        <TalkiButton
          testID={testIds.parent.settingsImportReplace}
          label="החלפה"
          variant="secondary"
          onPress={() => void onImport('replace')}
        />
      </View>
      {status ? <TalkiText color={v3.textSecondary}>{status}</TalkiText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginBlock: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
