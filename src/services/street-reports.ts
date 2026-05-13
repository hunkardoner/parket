import { supabase } from '@/lib/supabase';
import { loadLocalStreetReports, saveLocalStreetReports } from '@/services/local-store';
import { Coordinates, StreetParkingReport } from '@/types/parking';

const ACTIVE_REPORT_MINUTES = 90;

type StreetReportRow = {
  id: string;
  lat: number;
  lng: number;
  note: string | null;
  photo_uri: string | null;
  user_id: string | null;
  created_at: string;
  expires_at: string;
};

function makeId() {
  return `street-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function fromRow(row: StreetReportRow): StreetParkingReport {
  return {
    id: row.id,
    latitude: Number(row.lat),
    longitude: Number(row.lng),
    note: row.note ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function listStreetReports() {
  const localReports = await loadLocalStreetReports();
  const remoteReports: StreetParkingReport[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from('street_parking_reports')
      .select('id, lat, lng, note, photo_uri, user_id, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      remoteReports.push(...(data as StreetReportRow[]).map(fromRow));
    }
  }

  const reportsById = new Map<string, StreetParkingReport>();
  [...remoteReports, ...localReports].forEach((report) => reportsById.set(report.id, report));

  return [...reportsById.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createStreetReport(input: {
  coordinates: Coordinates;
  note?: string;
  photoUri?: string;
  userId?: string;
}) {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ACTIVE_REPORT_MINUTES * 60 * 1000);
  const report: StreetParkingReport = {
    id: makeId(),
    latitude: input.coordinates.latitude,
    longitude: input.coordinates.longitude,
    note: input.note,
    photoUri: input.photoUri,
    userId: input.userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const localReports = await loadLocalStreetReports();
  await saveLocalStreetReports([report, ...localReports].slice(0, 100));

  if (supabase) {
    await supabase.from('street_parking_reports').insert({
      id: report.id,
      lat: report.latitude,
      lng: report.longitude,
      note: report.note ?? null,
      photo_uri: report.photoUri ?? null,
      user_id: report.userId ?? null,
      created_at: report.createdAt,
      expires_at: report.expiresAt,
    });
  }

  return report;
}
