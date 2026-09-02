import { useLocalSearchParams } from 'expo-router';

import { ClozeScreen } from '@/features/practice/cloze/ClozeScreen';
import { CombineScreen } from '@/features/practice/combine/CombineScreen';
import { FocusScreen } from '@/features/practice/focus/FocusScreen';
import { PairsScreen } from '@/features/practice/pairs/PairsScreen';
import { ReceptiveScreen } from '@/features/practice/receptive/ReceptiveScreen';
import { TemptationScreen } from '@/features/practice/temptation/TemptationScreen';
import { StubScreen } from '@/features/stub/StubScreen';

export default function PracticeRoute() {
  const { id, catId, seed } = useLocalSearchParams<{ id: string; catId?: string; seed?: string }>();
  const seedNum = typeof seed === 'string' && seed.length ? Number(seed) : undefined;
  const resolvedSeed = typeof seedNum === 'number' && Number.isFinite(seedNum) ? seedNum : undefined;
  const resolvedCat = typeof catId === 'string' && catId.length ? catId : null;
  const props = { catId: resolvedCat, seed: resolvedSeed };

  switch (id) {
    case 'focus':
      return <FocusScreen {...props} />;
    case 'cloze':
      return <ClozeScreen {...props} />;
    case 'temptation':
      return <TemptationScreen {...props} />;
    case 'receptive':
      return <ReceptiveScreen {...props} />;
    case 'pairs':
      return <PairsScreen {...props} />;
    case 'combine':
      return <CombineScreen {...props} />;
    default:
      return <StubScreen testID="practice-stub-root" title={`תרגול: ${id}`} />;
  }
}
