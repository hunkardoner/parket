import AsyncStorage from '@react-native-async-storage/async-storage';

import { ParkedVehicle, StreetParkingReport } from '@/types/parking';

const PARKED_VEHICLE_KEY = 'parket:parked-vehicle';
const STREET_REPORTS_KEY = 'parket:street-reports';

export async function loadParkedVehicle() {
  const value = await AsyncStorage.getItem(PARKED_VEHICLE_KEY);
  return value ? (JSON.parse(value) as ParkedVehicle) : null;
}

export async function saveParkedVehicle(vehicle: ParkedVehicle) {
  await AsyncStorage.setItem(PARKED_VEHICLE_KEY, JSON.stringify(vehicle));
}

export async function clearParkedVehicle() {
  await AsyncStorage.removeItem(PARKED_VEHICLE_KEY);
}

export async function loadLocalStreetReports() {
  const value = await AsyncStorage.getItem(STREET_REPORTS_KEY);
  const reports = value ? (JSON.parse(value) as StreetParkingReport[]) : [];
  const now = Date.now();

  return reports.filter((report) => new Date(report.expiresAt).getTime() > now);
}

export async function saveLocalStreetReports(reports: StreetParkingReport[]) {
  await AsyncStorage.setItem(STREET_REPORTS_KEY, JSON.stringify(reports));
}
