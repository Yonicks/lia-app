import { describe, expect, it } from 'vitest';

import { CLOZE } from '@/domain/practice/content';
import { clozeModelSpeech, clozeReducer, initCloze, canFailCloze } from '@/features/practice/cloze/clozeReducer';
import { CLOZE_POOL, CLOZE_WAIT_MS } from '@/features/practice/practiceTimings';

const rnd = () => 0.2;

describe('cloze reducer', () => {
  it('pool is 6 shuffled CLOZE items and starts in say', () => {
    const s = initCloze(rnd);
    expect(s.pool).toHaveLength(CLOZE_POOL);
    expect(s.phase).toBe('say');
    expect(s.score).toBe(0);
    expect(s.done).toBe(false);
    for (const it of s.pool) {
      expect(CLOZE.some((c) => c.phrase === it.phrase && c.answer === it.answer)).toBe(true);
    }
  });

  it('phases progress say -> wait -> model and wait does not advance itself', () => {
    let s = initCloze(rnd);
    expect(s.phase).toBe('say');
    s = clozeReducer(s, { type: 'PHASE', phase: 'wait' });
    expect(s.phase).toBe('wait');
    expect(s.i).toBe(0);
    expect(s.done).toBe(false);
    s = clozeReducer(s, { type: 'PHASE', phase: 'model' });
    expect(s.phase).toBe('model');
    expect(s.i).toBe(0);
  });

  it('model speech is answer, then phrase, then answer', () => {
    const it = CLOZE[0]!;
    expect(clozeModelSpeech(it)).toBe(`${it.answer}. ${it.phrase} ${it.answer}`);
  });

  it('scoring is parent-driven — NEXT scored true increments, false does not', () => {
    let s = initCloze(rnd);
    s = clozeReducer(s, { type: 'NEXT', scored: false });
    expect(s.score).toBe(0);
    expect(s.i).toBe(1);
    expect(s.phase).toBe('say');
    s = clozeReducer(s, { type: 'NEXT', scored: true });
    expect(s.score).toBe(1);
  });

  it('wait duration constant is 5000 and leaving NEXT resets to say', () => {
    expect(CLOZE_WAIT_MS).toBe(5000);
    let s = initCloze(rnd);
    s = clozeReducer(s, { type: 'PHASE', phase: 'wait' });
    s = clozeReducer(s, { type: 'NEXT', scored: false });
    expect(s.phase).toBe('say');
  });

  it('done after the pool is exhausted', () => {
    let s = initCloze(rnd);
    for (let i = 0; i < CLOZE_POOL; i++) s = clozeReducer(s, { type: 'NEXT', scored: true });
    expect(s.done).toBe(true);
    expect(s.score).toBe(CLOZE_POOL);
    expect(canFailCloze(s)).toBe(false);
  });
});
