import AsyncStorage from '@react-native-async-storage/async-storage';

import { Coordinates } from '@/types/parking';

const LAST_LOCATION_KEY = 'parket:last-location';

export async function saveLastKnownLocation(location: Coordinates) {
  await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
}

export async function loadLastKnownLocation() {
  const value = await AsyncStorage.getItem(LAST_LOCATION_KEY);
  return value ? (JSON.parse(value) as Coordinates) : null;
}
