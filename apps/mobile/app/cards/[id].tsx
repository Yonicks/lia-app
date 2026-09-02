import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/features/stub/StubScreen';

export default function CardsStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StubScreen testID="cards-stub-root" title={`כרטיסיות: ${id}`} />;
}
