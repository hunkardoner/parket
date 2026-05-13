import { supabase } from '@/lib/supabase';
import { ParkedVehicle } from '@/types/parking';

export type ParkingHistoryEntry = {
  id: string;
  userId: string;
  source: 'street' | 'ispark' | 'custom';
  title: string;
  latitude: number;
  longitude: number;
  addressHint?: string;
  lotId?: number;
  photoUri?: string;
  parkedAt: string;
  endedAt?: string;
  isFavorite: boolean;
  createdAt: string;
};

type HistoryRow = {
  id: string;
  user_id: string;
  source: string;
  title: string;
  lat: number;
  lng: number;
  address_hint: string | null;
  lot_id: number | null;
  photo_uri: string | null;
  parked_at: string;
  ended_at: string | null;
  is_favorite: boolean;
  created_at: string;
};

function fromRow(row: HistoryRow): ParkingHistoryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    source: row.source as ParkingHistoryEntry['source'],
    title: row.title,
    latitude: Number(row.lat),
    longitude: Number(row.lng),
    addressHint: row.address_hint ?? undefined,
    lotId: row.lot_id ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    parkedAt: row.parked_at,
    endedAt: row.ended_at ?? undefined,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
  };
}

/** Save a new parking session to history */
export async function addToHistory(vehicle: ParkedVehicle, userId: string) {
  if (!supabase) return;

  await supabase.from('parking_history').insert({
    id: vehicle.id,
    user_id: userId,
    source: vehicle.source,
    title: vehicle.title,
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    address_hint: vehicle.addressHint ?? null,
    lot_id: vehicle.lotId ?? null,
    photo_uri: vehicle.photoUri ?? null,
    parked_at: vehicle.createdAt,
    is_favorite: false,
  });
}

/** Mark a parking session as ended */
export async function endHistorySession(vehicleId: string) {
  if (!supabase) return;

  await supabase
    .from('parking_history')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', vehicleId);
}

/** Get user's parking history, most recent first */
export async function listHistory(userId: string, limit = 50): Promise<ParkingHistoryEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('parking_history')
    .select('*')
    .eq('user_id', userId)
    .order('parked_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as HistoryRow[]).map(fromRow);
}

/** Get user's favorites only */
export async function listFavorites(userId: string): Promise<ParkingHistoryEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('parking_history')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('parked_at', { ascending: false });

  if (error || !data) return [];
  return (data as HistoryRow[]).map(fromRow);
}

/** Toggle favorite status */
export async function toggleFavorite(entryId: string, isFavorite: boolean) {
  if (!supabase) return;

  await supabase
    .from('parking_history')
    .update({ is_favorite: isFavorite })
    .eq('id', entryId);
}

/** Delete a history entry */
export async function deleteHistoryEntry(entryId: string) {
  if (!supabase) return;

  await supabase
    .from('parking_history')
    .delete()
    .eq('id', entryId);
}
