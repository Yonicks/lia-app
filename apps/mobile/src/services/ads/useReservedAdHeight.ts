import { useEffect, useState } from 'react';

import { getReservedAdHeight, subscribeReservedAdHeight } from './adLayout';

export function useReservedAdHeight(): number {
  const [height, setHeight] = useState(getReservedAdHeight);
  useEffect(() => subscribeReservedAdHeight(() => setHeight(getReservedAdHeight())), []);
  return height;
}
