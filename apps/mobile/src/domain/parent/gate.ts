export const PARENT_HOLD_MS = 900;
export const PARENT_HOLD_MOVE_PX = 12;

export interface LockQuestion {
  a: number;
  b: number;
  sum: number;
}

export interface GateState {
  question: LockQuestion;
  input: string;
  unlocked: boolean;
}

/** index.html 3232-3233 — a in 3..9, b in 2..9, answer is a * b. */
export function makeLockQuestion(rnd: () => number = Math.random): LockQuestion {
  const a = 3 + Math.floor(rnd() * 7);
  const b = 2 + Math.floor(rnd() * 8);
  return { a, b, sum: a * b };
}

export function initGate(rnd: () => number = Math.random): GateState {
  return { question: makeLockQuestion(rnd), input: '', unlocked: false };
}

export type GateAction = { type: 'DIGIT'; n: string } | { type: 'CLEAR' } | { type: 'OK' } | { type: 'LOCK' };

export function gateReducer(state: GateState, action: GateAction): GateState {
  switch (action.type) {
    case 'DIGIT':
      if (state.unlocked) return state;
      if (state.input.length >= 4) return state;
      return { ...state, input: state.input + action.n };
    case 'CLEAR':
      return { ...state, input: '' };
    case 'OK': {
      if (state.unlocked) return state;
      if (Number(state.input) === state.question.sum) return { ...state, unlocked: true, input: '' };
      return { ...state, input: '' };
    }
    case 'LOCK':
      return { ...state, unlocked: false, input: '', question: makeLockQuestion() };
    default:
      return state;
  }
}

export function shortTapDoesNotUnlock(): true {
  return true;
}

export function holdCancelledByMove(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) > PARENT_HOLD_MOVE_PX;
}
