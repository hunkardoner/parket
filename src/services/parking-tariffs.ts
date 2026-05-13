import { supabase } from '@/lib/supabase';

export type ParkingTariff = {
  id: string;
  parkId: number;
  parkName: string;
  district?: string;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  tariffText?: string;
  freeMinutes: number;
  notes?: string;
  updatedAt: string;
};

type TariffRow = {
  id: string;
  park_id: number;
  park_name: string;
  district: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  monthly_rate: number | null;
  tariff_text: string | null;
  free_minutes: number;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: TariffRow): ParkingTariff {
  return {
    id: row.id,
    parkId: row.park_id,
    parkName: row.park_name,
    district: row.district ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    dailyRate: row.daily_rate ?? undefined,
    monthlyRate: row.monthly_rate ?? undefined,
    tariffText: row.tariff_text ?? undefined,
    freeMinutes: row.free_minutes,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

/** Fetch all tariffs (indexed by parkId) */
export async function listTariffs(): Promise<Map<number, ParkingTariff>> {
  const map = new Map<number, ParkingTariff>();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from('parking_tariffs')
    .select('*')
    .order('park_name');

  if (error || !data) return map;
  for (const row of data as TariffRow[]) {
    const tariff = fromRow(row);
    map.set(tariff.parkId, tariff);
  }
  return map;
}

/** Fetch tariff for a specific park */
export async function getTariff(parkId: number): Promise<ParkingTariff | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('parking_tariffs')
    .select('*')
    .eq('park_id', parkId)
    .single();

  if (error || !data) return null;
  return fromRow(data as TariffRow);
}

/** Upsert a tariff entry */
export async function upsertTariff(input: {
  parkId: number;
  parkName: string;
  district?: string;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  tariffText?: string;
  freeMinutes?: number;
  notes?: string;
  updatedBy: string;
}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('parking_tariffs')
    .upsert(
      {
        park_id: input.parkId,
        park_name: input.parkName,
        district: input.district ?? null,
        hourly_rate: input.hourlyRate ?? null,
        daily_rate: input.dailyRate ?? null,
        monthly_rate: input.monthlyRate ?? null,
        tariff_text: input.tariffText ?? null,
        free_minutes: input.freeMinutes ?? 0,
        notes: input.notes ?? null,
        updated_by: input.updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'park_id' }
    )
    .select()
    .single();

  if (error || !data) return null;
  return fromRow(data as TariffRow);
}

/** Delete a tariff */
export async function deleteTariff(tariffId: string) {
  if (!supabase) return;
  await supabase.from('parking_tariffs').delete().eq('id', tariffId);
}
