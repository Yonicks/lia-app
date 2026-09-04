import type { GameShellProps } from '../../games/shell/GameShell';
import { GameShell } from '../../games/shell/GameShell';

export type PracticeShellProps = Omit<GameShellProps, 'world'>;

/**
 * Shared landscape practice-detail frame (Phase 26).
 *
 * Reuses GameShell chrome (top bar, title, chips, done card, toast,
 * celebrate) with the practice world background. Boards supply content
 * only; metrics come from landscapeTokens — no local breakpoints.
 */
export function PracticeShell(props: PracticeShellProps) {
  return <GameShell {...props} world="practice" />;
}
