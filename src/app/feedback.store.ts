import { computed, Injectable, signal } from '@angular/core';
import { DriverStat, SEED_TRIPS, Submission, Trip } from './models';

@Injectable({
  providedIn: 'root',
})
export class FeedbackStore {
  // State signals
  readonly trips = signal<Trip[]>(SEED_TRIPS);
  readonly submissions = signal<Submission[]>([]);
  readonly selectedTripId = signal<string>('');

  // Derived set of trip IDs that have already been rated
  readonly ratedTripIds = computed<Set<string>>(() => {
    return new Set(this.submissions().map((s) => s.tripId));
  });

  // Summary for active/selected trip matching mockup: "Trip TRIP-2041 overall: 4.0 (3 responses)"
  readonly activeTripSummary = computed(() => {
    const activeId = this.selectedTripId() || (this.trips()[0]?.tripId ?? 'TRIP-2041');
    const tripSubs = this.submissions().filter((s) => s.tripId === activeId);
    const count = tripSubs.length;
    const avg = count > 0 ? tripSubs.reduce((acc, curr) => acc + curr.rating, 0) / count : null;
    return { tripId: activeId, count, avg };
  });

  // Derived driver statistics: purely computed, never stored separately
  readonly driverStats = computed<DriverStat[]>(() => {
    const tripsList = this.trips();
    const subsList = this.submissions();

    // Map each trip ID to its corresponding driver ID for O(1) submission lookup
    const tripToDriverMap = new Map<string, string>();
    // Collect unique drivers preserving order of appearance
    const driversMap = new Map<string, { driverId: string; driverName: string; tripCount: number }>();

    for (const trip of tripsList) {
      tripToDriverMap.set(trip.tripId, trip.driverId);
      const existing = driversMap.get(trip.driverId);
      if (existing) {
        existing.tripCount += 1;
      } else {
        driversMap.set(trip.driverId, {
          driverId: trip.driverId,
          driverName: trip.driverName,
          tripCount: 1,
        });
      }
    }

    // Accumulate ratings per driver in chronological sequence
    const ratingsMap = new Map<string, number[]>();
    for (const sub of subsList) {
      const driverId = tripToDriverMap.get(sub.tripId);
      if (driverId) {
        const list = ratingsMap.get(driverId) ?? [];
        list.push(sub.rating);
        ratingsMap.set(driverId, list);
      }
    }

    // Calculate overall fleet average if any submissions exist
    const allSubsCount = subsList.length;
    const fleetAvg =
      allSubsCount > 0
        ? subsList.reduce((acc, curr) => acc + curr.rating, 0) / allSubsCount
        : null;

    return Array.from(driversMap.values()).map((driver) => {
      const ratings = ratingsMap.get(driver.driverId) ?? [];
      const ratingCount = ratings.length;
      const avg = ratingCount > 0 ? ratings.reduce((acc, val) => acc + val, 0) / ratingCount : null;

      // Compute Trend: dynamic delta calculation
      let trend = '—';
      let trendExplanation = 'No rating data available yet';

      if (ratingCount >= 2 && avg !== null) {
        const prevAvg = ratings.slice(0, -1).reduce((acc, val) => acc + val, 0) / (ratingCount - 1);
        const diff = avg - prevAvg;
        trend = diff > 0.05 ? `▲ +${diff.toFixed(1)}` : diff < -0.05 ? `▼ ${diff.toFixed(1)}` : '▬ 0.0';
        trendExplanation = `Rating shift from previous average (${prevAvg.toFixed(2)} → ${avg.toFixed(2)}): ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
      } else if (ratingCount === 1 && avg !== null) {
        const benchmark = fleetAvg !== null && allSubsCount > 1 ? fleetAvg : 4.0;
        const benchmarkName = fleetAvg !== null && allSubsCount > 1 ? 'fleet average' : '4.0 baseline';
        const diff = avg - benchmark;
        trend = diff > 0.05 ? `▲ +${diff.toFixed(1)}` : diff < -0.05 ? `▼ ${diff.toFixed(1)}` : '▬ 0.0';
        trendExplanation = `Performance vs ${benchmarkName} (${avg.toFixed(2)} vs ${benchmark.toFixed(2)}): ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
      }

      return {
        driverId: driver.driverId,
        driverName: driver.driverName,
        tripCount: driver.tripCount,
        ratingCount,
        avg,
        trend,
        trendExplanation,
      };
    });
  });

  /**
   * Appends a new feedback submission.
   * Throws an error if the trip has already been rated (guard beyond UI).
   */
  submit(submission: Submission): void {
    if (this.ratedTripIds().has(submission.tripId)) {
      throw new Error(`Trip ${submission.tripId} has already been rated.`);
    }
    this.submissions.update((current) => [...current, submission]);
  }
}
