import { supabase } from '@/lib/supabase';

export type CustomLotCategory = 'mall' | 'hospital' | 'private' | 'other';

export type CustomParkingLot = {
  id: string;
  name: string;
  category: CustomLotCategory;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  capacity: number;
  emptyCapacity: number;
  isFree: boolean;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  tariffText?: string;
  freeMinutes: number;
  workHours?: string;
  phone?: string;
  website?: string;
  isActive: boolean;
  managerUserId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

type CustomLotRow = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  district: string | null;
  capacity: number;
  empty_capacity: number;
  is_free: boolean;
  hourly_rate: number | null;
  daily_rate: number | null;
  monthly_rate: number | null;
  tariff_text: string | null;
  free_minutes: number;
  work_hours: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  manager_user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: CustomLotRow): CustomParkingLot {
  return {
    id: row.id,
    name: row.name,
    category: row.category as CustomLotCategory,
    latitude: Number(row.lat),
    longitude: Number(row.lng),
    address: row.address ?? undefined,
    district: row.district ?? undefined,
    capacity: row.capacity,
    emptyCapacity: row.empty_capacity,
    isFree: row.is_free,
    hourlyRate: row.hourly_rate ?? undefined,
    dailyRate: row.daily_rate ?? undefined,
    monthlyRate: row.monthly_rate ?? undefined,
    tariffText: row.tariff_text ?? undefined,
    freeMinutes: row.free_minutes,
    workHours: row.work_hours ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    isActive: row.is_active,
    managerUserId: row.manager_user_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const CATEGORY_LABELS: Record<CustomLotCategory, string> = {
  mall: '🏬 AVM',
  hospital: '🏥 Hastane',
  private: '🅿️ Özel Otopark',
  other: '📍 Diğer',
};

/** Fetch all active custom lots */
export async function listCustomLots(): Promise<CustomParkingLot[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('custom_parking_lots')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];
  return (data as CustomLotRow[]).map(fromRow);
}

/** Fetch lots by category */
export async function listCustomLotsByCategory(category: CustomLotCategory): Promise<CustomParkingLot[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('custom_parking_lots')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .order('name');

  if (error || !data) return [];
  return (data as CustomLotRow[]).map(fromRow);
}

/** Fetch a lot managed by a specific user (for manager panel) */
export async function getManagerLot(userId: string): Promise<CustomParkingLot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('custom_parking_lots')
    .select('*')
    .eq('manager_user_id', userId)
    .limit(1)
    .single();

  if (error || !data) return null;
  return fromRow(data as CustomLotRow);
}

/** Update the capacity (used by manager +/- buttons) */
export async function updateLotCapacity(lotId: string, emptyCapacity: number) {
  if (!supabase) return;

  await supabase
    .from('custom_parking_lots')
    .update({
      empty_capacity: Math.max(0, emptyCapacity),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lotId);
}

/** Create a new custom lot */
export async function createCustomLot(input: {
  name: string;
  category: CustomLotCategory;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  capacity: number;
  isFree: boolean;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  tariffText?: string;
  freeMinutes?: number;
  workHours?: string;
  phone?: string;
  website?: string;
  managerUserId?: string;
  createdBy: string;
}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('custom_parking_lots')
    .insert({
      name: input.name,
      category: input.category,
      lat: input.latitude,
      lng: input.longitude,
      address: input.address ?? null,
      district: input.district ?? null,
      capacity: input.capacity,
      empty_capacity: input.capacity,
      is_free: input.isFree,
      hourly_rate: input.hourlyRate ?? null,
      daily_rate: input.dailyRate ?? null,
      monthly_rate: input.monthlyRate ?? null,
      tariff_text: input.tariffText ?? null,
      free_minutes: input.freeMinutes ?? 0,
      work_hours: input.workHours ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      manager_user_id: input.managerUserId ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error || !data) return null;
  return fromRow(data as CustomLotRow);
}

/** Update a custom lot's pricing */
export async function updateLotPricing(lotId: string, pricing: {
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  tariffText?: string;
  freeMinutes?: number;
}) {
  if (!supabase) return;

  await supabase
    .from('custom_parking_lots')
    .update({
      hourly_rate: pricing.hourlyRate ?? null,
      daily_rate: pricing.dailyRate ?? null,
      monthly_rate: pricing.monthlyRate ?? null,
      tariff_text: pricing.tariffText ?? null,
      free_minutes: pricing.freeMinutes ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lotId);
}
