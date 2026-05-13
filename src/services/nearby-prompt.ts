import { Alert } from 'react-native';

import { createStreetReport } from '@/services/street-reports';
import { Coordinates } from '@/types/parking';

/**
 * After the user parks their car, always ask:
 *   "Yakınlarda parka uygun boş yer var mı?"
 *
 * If the user answers yes, a street parking report is created at
 * the given coordinates so nearby users can see available spots.
 *
 * Works for all parking types: street, İSPARK, AVM, hospital, private.
 */
export function askNearbyFreeSpot(
  coordinates: Coordinates,
  userId?: string,
  onDone?: () => void,
) {
  Alert.alert(
    '🟢 Yakınlarda boş yer var mı?',
    'Park ettiğin konumun yakınında başka araçların park edebileceği boş bir yer gördün mü? Bildirirsen yakınlarda park arayan diğer kullanıcılara yardımcı olursun.',
    [
      {
        text: 'Hayır, görmedim',
        style: 'cancel',
        onPress: () => onDone?.(),
      },
      {
        text: 'Evet, boş yer var',
        style: 'default',
        onPress: async () => {
          try {
            await createStreetReport({
              coordinates,
              note: 'Park eden kullanıcı yakınında boş yer olduğunu bildirdi.',
              userId,
            });
          } catch {
            // best-effort — don't block the parking flow
          }
          onDone?.();
        },
      },
    ],
    { cancelable: false },
  );
}
