import { Image, Pressable, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { plain } from '@/domain/vocabulary/niqqud';
import { wordImage } from '@/domain/vocabulary/wordImage';
import type { TalkiWord } from '@/domain/types';
import { testIds } from '@/testing/testIds';

export type QuizOptionFeedback = 'idle' | 'correct' | 'wrong';

export interface QuizOptionProps {
  word: TalkiWord;
  index: number;
  feedback: QuizOptionFeedback;
  onPress: () => void;
}

/**
 * index.html `.opt` (2575-2576) — picture only, no printed word. The
 * accessibility label is the plain form so a screen reader (and the
 * Playwright burst helper) can find the option that matches the prompt.
 * Size comes from landscape tokens (Phase 24) — no local breakpoints.
 */
export function QuizOption({ word, index, feedback, onPress }: QuizOptionProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const art = word.photo ? { uri: word.photo } : wordImage(word);
  const feedbackId =
    feedback === 'correct' ? testIds.quiz.optionCorrect : feedback === 'wrong' ? testIds.quiz.optionWrong : undefined;
  const edge = tokens.quizOptionMin;
  const oneRow = tokens.quizGridMode === '1x4';

  return (
    <Pressable
      testID={testIds.quiz.option(index)}
      accessibilityRole="button"
      accessibilityLabel={plain(word.word)}
      onPress={onPress}
      style={[
        styles.card,
        shadowSm,
        {
          flexGrow: oneRow ? 1 : 0,
          flexBasis: edge,
          width: edge,
          height: edge,
          minWidth: edge,
          minHeight: edge,
          maxWidth: oneRow ? edge + 48 : edge + 16,
          maxHeight: oneRow ? edge + 48 : edge + 16,
        },
        feedback === 'correct' && styles.correct,
        feedback === 'wrong' && styles.wrong,
      ]}
    >
      {feedbackId ? <TalkiText testID={feedbackId} style={styles.srOnly} /> : null}
      {art ? (
        <Image source={art} style={styles.art} resizeMode="contain" />
      ) : (
        <TalkiText style={styles.emoji}>{word.emoji}</TalkiText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  correct: {
    borderColor: v3.green500,
  },
  wrong: {
    borderColor: v3.pink500,
  },
  art: {
    width: '72%',
    height: '72%',
  },
  emoji: {
    fontSize: 48,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
