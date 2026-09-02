import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/features/stub/StubScreen';

export default function PracticeStub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StubScreen testID="practice-stub-root" title={`תרגול: ${id}`} />;
}
