export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface Trip {
  tripId: string;
  driverId: string;
  driverName: string;
}

export interface Submission {
  tripId: string;
  rating: RatingValue;
  onTime: boolean;
  cabClean?: boolean;
  comment?: string;
}

export interface DriverStat {
  driverId: string;
  driverName: string;
  tripCount: number;
  ratingCount: number;
  avg: number | null;
  trend?: string;
  trendExplanation?: string;
}

export const SEED_TRIPS: Trip[] = [
  { tripId: 'TRIP-2041', driverId: 'DRV-88', driverName: 'Ramesh K' },
  { tripId: 'TRIP-2043', driverId: 'DRV-12', driverName: 'Suresh P' }
];
