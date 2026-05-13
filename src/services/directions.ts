import { Linking, Platform } from 'react-native';

import { Coordinates } from '@/types/parking';

export async function openWalkingDirections(target: Coordinates, label = 'Parket konumu') {
  const destination = `${target.latitude},${target.longitude}`;
  const encodedLabel = encodeURIComponent(label);
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&q=${encodedLabel}&dirflg=w`
      : Platform.OS === 'android'
        ? `google.navigation:q=${destination}&mode=w`
        : fallback;

  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(fallback);
  }
}
