import type { ComponentType } from 'react';

import type { PracticeModeId } from '@/domain/types';

import { ClozeScreen } from './cloze/ClozeScreen';
import { CombineScreen } from './combine/CombineScreen';
import { FocusScreen } from './focus/FocusScreen';
import { PairsScreen } from './pairs/PairsScreen';
import { ReceptiveScreen } from './receptive/ReceptiveScreen';
import { TemptationScreen } from './temptation/TemptationScreen';

export interface PracticeScreenProps {
  catId: string | null;
  seed?: number;
}

export const practiceRegistry: Record<PracticeModeId, ComponentType<PracticeScreenProps>> = {
  focus: FocusScreen,
  cloze: ClozeScreen,
  temptation: TemptationScreen,
  receptive: ReceptiveScreen,
  pairs: PairsScreen,
  combine: CombineScreen,
};

export function registeredPractice(id: string): ComponentType<PracticeScreenProps> | undefined {
  return practiceRegistry[id as PracticeModeId];
}
