import { useLocalSearchParams } from 'expo-router';

import { CategoryScreen } from '@/features/categories/CategoryScreen';
import type { CategoryId } from '@/domain/types';

export default function Category() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryScreen catId={id as CategoryId} />;
}
