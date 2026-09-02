import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/features/stub/StubScreen';

export default function GameStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StubScreen testID="game-stub-root" title={`משחק: ${id}`} />;
}
