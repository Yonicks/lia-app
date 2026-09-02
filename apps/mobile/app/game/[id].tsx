import { useLocalSearchParams } from 'expo-router';

import { registeredGame } from '@/features/games/shell/gameRegistry';
import { StubScreen } from '@/features/stub/StubScreen';

export default function GameRoute() {
  const { id, catId, seed } = useLocalSearchParams<{ id: string; catId?: string; seed?: string }>();
  const game = id ? registeredGame(id) : undefined;
  if (game) {
    const Screen = game.Screen;
    const seedNum = typeof seed === 'string' && seed.length ? Number(seed) : undefined;
    return (
      <Screen
        catId={typeof catId === 'string' && catId.length ? catId : null}
        seed={typeof seedNum === 'number' && Number.isFinite(seedNum) ? seedNum : undefined}
      />
    );
  }
  return <StubScreen testID="game-stub-root" title={`משחק: ${id}`} />;
}
