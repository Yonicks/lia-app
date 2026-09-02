import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { PhotoService } from './types';

const SIZE = 320;

function e2eStub(): string | null {
  if (typeof window === 'undefined') return null;
  const stub = (window as unknown as { __talkiCustomPhoto?: string }).__talkiCustomPhoto;
  return typeof stub === 'string' ? stub : null;
}

export const photoService: PhotoService = {
  async pick() {
    const injected = e2eStub();
    if (injected) return injected;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;

    const out = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: SIZE, height: SIZE } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (out.base64) return `data:image/jpeg;base64,${out.base64}`;
    return out.uri;
  },
};

export type { PhotoService } from './types';
