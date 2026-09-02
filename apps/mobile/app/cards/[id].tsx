import { useLocalSearchParams } from 'expo-router';

import { CardsScreen } from '@/features/games/cards/CardsScreen';

export default function CardsRoute() {
  const { id, seed } = useLocalSearchParams<{ id: string; seed?: string }>();
  const seedNum = typeof seed === 'string' && seed.length ? Number(seed) : undefined;
  return (
    <CardsScreen
      catId={typeof id === 'string' && id.length ? id : null}
      seed={typeof seedNum === 'number' && Number.isFinite(seedNum) ? seedNum : undefined}
    />
  );
}
