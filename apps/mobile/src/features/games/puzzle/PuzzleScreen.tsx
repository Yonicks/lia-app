import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { puzzleAdvance, puzzleLevel } from '@/domain/games/puzzle';
import type { TalkiCategory, TalkiSettings, WordStats } from '@/domain/types';
import { homeHref } from '@/domain/navigation/routes';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { makeRnd } from '../shell/e2eSeed';
import { GameShell } from '../shell/GameShell';
import { useGameSession, type GameSession } from '../shell/useGameSession';
import { PuzzleDoneCard } from './PuzzleDoneCard';
import { PuzzlePiece } from './PuzzlePiece';
import { PuzzleSlot } from './PuzzleSlot';
import { puzzleSlotUnder, type SlotRect } from './puzzleHit';
import { initPuzzle, puzzleChips, puzzleReducer, type PuzzleState } from './puzzleReducer';

const PUZZLE_FINISH_MS = 1100;
const INSTRUCTION = 'שִׂימִי כָּל תְּמוּנָה בַּמָּקוֹם שֶׁלָּהּ';

export interface PuzzleScreenProps {
  catId: string | null;
  seed?: number;
}

function e2eNumber(key: string): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = (window as unknown as Record<string, unknown>)[key];
  return typeof raw === 'number' ? raw : undefined;
}

function finishDelay(): number {
  return e2eNumber('__talkiPuzzleFinishMs') ?? PUZZLE_FINISH_MS;
}

function initialPuzzle(
  category: TalkiCategory,
  stats: Record<string, WordStats>,
  settings: TalkiSettings,
  height: number,
  width: number,
  boards: number,
  seed?: number,
): PuzzleState {
  return initPuzzle(
    { category, stats, settings, rnd: makeRnd(seed) },
    {
      height,
      width,
      level: e2eNumber('__talkiPuzzleLevel') ?? settings.puzzleLevel,
      boards: e2eNumber('__talkiPuzzleBoards') ?? boards,
      capacityOverride: e2eNumber('__talkiPuzzleCapacity'),
    },
  );
}

export function PuzzleScreen({ catId, seed }: PuzzleScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'puzzle', requestedCatId: catId });
  const [boards, setBoards] = useState(0);

  useEffect(() => {
    if (session.failed) {
      const t = setTimeout(() => push(homeHref), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session.failed, push]);

  if (!session.ready || !session.category) {
    return (
      <GameShell
        title="🧩 שִׂימִי בַּמָּקוֹם"
        chips={[]}
        done={false}
        result={{ score: 0, total: 3 }}
        onBack={goBack}
        onReplay={session.restart}
        onHome={() => push(homeHref)}
        toast={session.toast}
        onDismissToast={session.dismissToast}
        celebrateMessage={null}
        onDismissCelebrate={() => undefined}
        scoring={false}
      >
        {null}
      </GameShell>
    );
  }

  return (
    <PuzzlePlay
      key={`${session.category.id}:${session.epoch}`}
      category={session.category}
      session={session}
      seed={seed}
      boards={boards}
      onBoardDone={() => setBoards((n) => n + 1)}
    />
  );
}

function PuzzlePlay({
  category,
  session,
  seed,
  boards,
  onBoardDone,
}: {
  category: TalkiCategory;
  session: GameSession;
  seed?: number;
  boards: number;
  onBoardDone: () => void;
}) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { stats, recordSeen, markLearned } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const setPuzzleLevel = useSettingsStore((s) => s.setPuzzleLevel);
  const told = useRef(false);
  const finishFired = useRef(false);
  /** Slot rects in board-local coordinates (Phase 25). */
  const layouts = useRef<Record<string, Omit<SlotRect, 'id' | 'filled'>>>({});
  const boardOrigin = useRef({ x: 0, y: 0 });
  const [state, dispatch] = useReducer(puzzleReducer, undefined, () =>
    initialPuzzle(category, stats, settings, layout.usableHeight, layout.usableWidth, boards, seed),
  );

  useEffect(() => {
    if (state.done || told.current) return;
    told.current = true;
    void wordVoiceService.say(category.id, INSTRUCTION, { core: true });
  }, [state.done, category.id]);

  useEffect(() => {
    if (!state.finishing || finishFired.current) return;
    finishFired.current = true;
    const id = session.schedule(finishDelay(), () => {
      dispatch({ type: 'FINISH' });
      const current = puzzleLevel(settings.puzzleLevel);
      const next = puzzleAdvance(current, state.misses);
      if (next !== current) void setPuzzleLevel(next);
      session.audio.complete();
      onBoardDone();
    });
    return () => session.cancel(id);
  }, [state.finishing, state.misses, session, settings.puzzleLevel, setPuzzleLevel, onBoardDone]);

  const place = useCallback(
    (pieceId: string, slotId: string) => {
      const piece = state.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.placed) return;
      const ok = pieceId === slotId;
      dispatch({ type: 'PLACE', pieceId, slotId });
      if (ok) {
        const complete = state.placed + 1 >= state.pieces.length;
        if (complete) session.audio.dragDrop();
        else session.audio.correctMatch();
        void recordSeen(category.id, piece.it.word, false);
        void markLearned(category.id, piece.it.word);
        void wordVoiceService.say(category.id, piece.it.word);
      } else {
        session.audio.invalidMove();
        const nextMisses = piece.misses + 1;
        if (nextMisses >= 2) {
          void wordVoiceService.say(category.id, piece.it.word);
        }
      }
    },
    [state.pieces, state.placed, session, category.id, recordSeen, markLearned],
  );

  const onSlot = useCallback(
    (slotId: string) => {
      if (!state.sel) return;
      place(state.sel, slotId);
    },
    [state.sel, place],
  );

  const onDragEnd = useCallback(
    (pieceId: string, pageX: number, pageY: number, box: { x: number; y: number; width: number; height: number }) => {
      const origin = boardOrigin.current;
      const localCx = pageX - origin.x;
      const localCy = pageY - origin.y;
      const localBox = {
        x: box.x - origin.x,
        y: box.y - origin.y,
        width: box.width,
        height: box.height,
      };
      const slots: SlotRect[] = state.slots.map((id) => {
        const piece = state.pieces.find((p) => p.id === id)!;
        const rect = layouts.current[id] ?? { x: 0, y: 0, width: 0, height: 0 };
        return { id, ...rect, filled: piece.placed };
      });
      const hit = puzzleSlotUnder(localCx, localCy, localBox, slots, state.tolerance);
      if (hit) place(pieceId, hit);
    },
    [state.slots, state.pieces, state.tolerance, place],
  );

  const demo =
    state.placed === 0 && state.misses === 0 && !state.sel
      ? state.tray.map((id) => state.pieces.find((p) => p.id === id)!).find((p) => !p.placed)
      : null;
  const guide = state.sel ? 'עַכְשָׁיו לוֹחֲצִים עַל הַצֵּל' : 'גּוֹרְרִים כָּל תְּמוּנָה אֶל הַצֵּל שֶׁלָּהּ';
  const pieceMin = tokens.puzzlePieceMin;

  return (
    <GameShell
      title="🧩 שִׂימִי בַּמָּקוֹם"
      chips={puzzleChips(state)}
      done={false}
      result={{ score: 0, total: 3 }}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
      scoring={false}
    >
      {state.done ? (
        <PuzzleDoneCard state={state} niqqud={settings.niqqud} onReplay={session.restart} onHome={() => push(homeHref)} />
      ) : (
        <View
          testID={testIds.puzzle.root}
          style={[styles.board, { gap: Math.max(6, tokens.gap - 2), paddingInline: tokens.padInline }]}
          onLayout={(e) => {
            const node = e.target as unknown as {
              measureInWindow?: (cb: (x: number, y: number) => void) => void;
            };
            node.measureInWindow?.((x, y) => {
              boardOrigin.current = { x, y };
            });
          }}
        >
          <View style={[styles.slots, { gap: Math.max(6, tokens.gap - 2) }]}>
            {state.slots.map((id) => {
              const piece = state.pieces.find((p) => p.id === id)!;
              return (
                <PuzzleSlot
                  key={id}
                  piece={piece}
                  hinted={state.hint === id}
                  niqqud={settings.niqqud}
                  minSize={pieceMin}
                  onPress={() => onSlot(id)}
                  onLayoutBox={(box) => {
                    // Convert window coords → board-local for hit testing.
                    layouts.current[id] = {
                      x: box.x - boardOrigin.current.x,
                      y: box.y - boardOrigin.current.y,
                      width: box.width,
                      height: box.height,
                    };
                  }}
                />
              );
            })}
          </View>
          <TalkiText testID={testIds.puzzle.guide} align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
            {guide}
          </TalkiText>
          <View style={[styles.tray, { gap: Math.max(6, tokens.gap - 2) }]}>
            {state.tray.map((id) => {
              const piece = state.pieces.find((p) => p.id === id)!;
              return (
                <PuzzlePiece
                  key={id}
                  piece={piece}
                  selected={state.sel === id}
                  nudge={demo?.id === id}
                  niqqud={settings.niqqud}
                  minSize={pieceMin}
                  onTap={() => {
                    session.audio.secondaryTap();
                    dispatch({ type: 'SELECT', id });
                  }}
                  onDragStart={() => session.audio.dragPickup()}
                  onDragEnd={(cx, cy, box) => onDragEnd(id, cx, cy, box)}
                />
              );
            })}
          </View>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    minHeight: 0,
    paddingBlock: 4,
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 1,
  },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
