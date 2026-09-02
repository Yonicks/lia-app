import { useCallback } from 'react';

import { audioEngine } from '@/services/audio';

/**
 * The only audio surface a game is allowed to touch. No `expo-audio`
 * import from a game (phase-08 standing rule). Start/complete live here
 * so every game gets the same cues; correct/wrong are optional because
 * not every game is a binary answer.
 */
export function useGameAudio() {
  const start = useCallback(() => {
    audioEngine.playSfx('game.levelStart');
  }, []);
  const complete = useCallback(() => {
    audioEngine.playSfx('game.levelComplete');
  }, []);
  const correct = useCallback(() => {
    audioEngine.playSfx('answer.correct');
  }, []);
  const wrong = useCallback(() => {
    audioEngine.playSfx('answer.retry');
  }, []);
  const correctMatch = useCallback(() => {
    audioEngine.playSfx('interaction.correctMatch');
  }, []);
  const invalidMove = useCallback(() => {
    audioEngine.playSfx('interaction.invalidMove');
  }, []);
  const dragPickup = useCallback(() => {
    audioEngine.playSfx('interaction.dragPickup');
  }, []);
  const dragDrop = useCallback(() => {
    audioEngine.playSfx('interaction.dragDrop');
  }, []);
  const secondaryTap = useCallback(() => {
    audioEngine.playSfx('ui.secondaryTap');
  }, []);
  return { start, complete, correct, wrong, correctMatch, invalidMove, dragPickup, dragDrop, secondaryTap };
}
