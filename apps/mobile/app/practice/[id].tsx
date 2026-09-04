import { StubScreen } from '@/features/stub/StubScreen';
import { practiceRegistry } from '@/features/practice/practiceRegistry';
import { useLocalSearchParams } from 'expo-router';

export default function PracticeRoute() {
  const { id, catId, seed } = useLocalSearchParams<{ id: string; catId?: string; seed?: string }>();
  const seedNum = typeof seed === 'string' && seed.length ? Number(seed) : undefined;
  const resolvedSeed = typeof seedNum === 'number' && Number.isFinite(seedNum) ? seedNum : undefined;
  const resolvedCat = typeof catId === 'string' && catId.length ? catId : null;
  const props = { catId: resolvedCat, seed: resolvedSeed };
  const Screen = id ? practiceRegistry[id as keyof typeof practiceRegistry] : undefined;
  if (!Screen) {
    return <StubScreen testID="practice-stub-root" title={`תרגול: ${id}`} />;
  }
  return <Screen {...props} />;
}
