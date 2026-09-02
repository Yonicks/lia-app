import { useKeepAwake } from 'expo-keep-awake';

/** Wake lock while Talki is in the foreground (index.html 4085-4087). */
export function useTalkiKeepAwake(): void {
  useKeepAwake();
}
