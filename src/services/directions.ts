import { router, type Href } from 'expo-router';

import { Coordinates } from '@/types/parking';

export async function openInAppMap(target: Coordinates, label = 'Parket konumu') {
  const href =
    `/map-target?latitude=${encodeURIComponent(String(target.latitude))}` +
    `&longitude=${encodeURIComponent(String(target.longitude))}` +
    `&label=${encodeURIComponent(label)}`;

  router.push(href as Href);
}
