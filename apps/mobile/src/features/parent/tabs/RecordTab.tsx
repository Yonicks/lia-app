import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TalkiCard, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { deleteRecording, recordingFlagsForCategory } from '@/domain/parent/recordings';
import type { CategoryId } from '@/domain/types';
import { allCats } from '@/domain/vocabulary/allCats';
import { recordingService } from '@/services/recording';
import { storage } from '@/services/storage';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { testIds } from '@/testing/testIds';

import { RecordButton } from '../components/RecordButton';

export function RecordTab() {
  const { custom, lastCat } = useProgressStore();
  const cats = allCats(custom);
  const [catId, setCatId] = useState<CategoryId>((lastCat as CategoryId) || cats[0]!.id);
  const cat = cats.find((c) => c.id === catId) ?? cats[0]!;
  const [selected, setSelected] = useState(0);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const current = allCats(custom).find((c) => c.id === catId) ?? allCats(custom)[0];
    if (!current) return;
    void (async () => {
      await wordVoiceService.preload(current.id);
      const next = await recordingFlagsForCategory(storage, current.id, current.items);
      if (!cancelled) setFlags(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [catId, custom]);

  const word = cat.items[selected];

  const refresh = async () => {
    setFlags(await recordingFlagsForCategory(storage, cat.id, cat.items));
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <TalkiCard>
        <TalkiHeading level={3}>הקלטת קול אמיתי</TalkiHeading>
        <TalkiText color={v3.textSecondary}>
          קול מוכר עובד הרבה יותר טוב מקול מסונתז. מקליטים פעם אחת, והאפליקציה תשמיע את זה במקום הקול הרובוטי.
        </TalkiText>
        <TalkiText weight="bold" style={styles.label}>
          קטגוריה
        </TalkiText>
        <ScrollView horizontal testID={testIds.parent.recordCategory} contentContainerStyle={styles.chips}>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => {
                setCatId(c.id);
                setSelected(0);
              }}
              style={[styles.chip, c.id === cat.id && styles.chipOn]}
            >
              <TalkiText weight="semibold">{c.title}</TalkiText>
            </Pressable>
          ))}
        </ScrollView>
        {status ? <TalkiText color={v3.textSecondary}>{status}</TalkiText> : null}
        {word ? (
          <RecordButton
            recording={recording}
            hasRec={!!flags[selected]}
            onStart={() => {
              void (async () => {
                try {
                  await recordingService.start(cat.id, word.word);
                  setRecording(true);
                  setStatus(`מקליטים עד ${recordingService.maxDurationMs} ms`);
                } catch {
                  setStatus('אין מיקרופון במכשיר הזה');
                }
              })();
            }}
            onStop={() => {
              void (async () => {
                try {
                  await recordingService.stop();
                } catch {
                  /* already stopped by the 4000 ms cap */
                }
                setRecording(false);
                setStatus(null);
                await refresh();
              })();
            }}
            onPlay={() => {
              void wordVoiceService.say(cat.id, word.word);
            }}
            onDelete={() => {
              void deleteRecording(storage, cat.id, word.word).then(refresh);
            }}
          />
        ) : null}
        <View style={styles.list}>
          {cat.items.map((it, i) => (
            <Pressable
              key={`${cat.id}-${it.word}`}
              testID={testIds.parent.recordWord(i)}
              accessibilityRole="button"
              onPress={() => setSelected(i)}
              style={[styles.word, i === selected && styles.wordOn]}
            >
              <TalkiText weight="bold">{it.word}</TalkiText>
              {flags[i] ? (
                <TalkiText color={v3.textSecondary} weight="semibold">
                  מוקלט
                </TalkiText>
              ) : null}
            </Pressable>
          ))}
        </View>
      </TalkiCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12, paddingBlockEnd: 32 },
  label: { marginBlockStart: 10 },
  chips: { gap: 8, paddingBlock: 8 },
  chip: {
    minHeight: 48,
    paddingInline: 12,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    justifyContent: 'center',
  },
  chipOn: { borderColor: v3.purple600, backgroundColor: v3.surface },
  list: { marginBlockStart: 12, gap: 6 },
  word: {
    minHeight: 48,
    paddingInline: 12,
    borderRadius: radii.btn,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordOn: { borderColor: v3.purple600 },
});
