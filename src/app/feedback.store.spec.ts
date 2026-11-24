import { TestBed } from '@angular/core/testing';
import { FeedbackStore } from './feedback.store';

describe('FeedbackStore', () => {
  let store: FeedbackStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeedbackStore],
    });
    store = TestBed.inject(FeedbackStore);
  });

  it('should initialize with seed trips and no submissions', () => {
    expect(store.trips().length).toBe(3);
    expect(store.submissions().length).toBe(0);
    expect(store.ratedTripIds().size).toBe(0);
  });

  it('should compute null and never NaN for drivers with zero ratings', () => {
    const stats = store.driverStats();
    expect(stats.length).toBe(2); // Ramesh K and Suresh P

    for (const driver of stats) {
      expect(driver.ratingCount).toBe(0);
      expect(driver.avg).toBeNull();
      expect(Number.isNaN(driver.avg)).toBe(false);
    }
  });

  it('should calculate driver averages accurately (Worked Example)', () => {
    store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });
    store.submit({ tripId: 'TRIP-2042', rating: 5, onTime: true, comment: 'Great service' });

    const stats = store.driverStats();
    const ramesh = stats.find((d) => d.driverId === 'DRV-88');
    const suresh = stats.find((d) => d.driverId === 'DRV-12');

    expect(ramesh).toBeDefined();
    expect(ramesh?.tripCount).toBe(2);
    expect(ramesh?.ratingCount).toBe(2);
    expect(ramesh?.avg).toBe(4.5);

    expect(suresh).toBeDefined();
    expect(suresh?.tripCount).toBe(1);
    expect(suresh?.ratingCount).toBe(0);
    expect(suresh?.avg).toBeNull();
  });

  it('should reject duplicate submissions for the same trip with an error', () => {
    store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });

    expect(store.ratedTripIds().has('TRIP-2041')).toBe(true);

    // Attempt duplicate submission
    expect(() => {
      store.submit({ tripId: 'TRIP-2041', rating: 5, onTime: false });
    }).toThrowError(/Trip TRIP-2041 has already been rated/);

    // Submission list count should remain 1
    expect(store.submissions().length).toBe(1);
  });

  it('should calculate dynamic trend indicators reactively', () => {
    // Zero ratings: trend is '—'
    expect(store.driverStats()[0].trend).toBe('—');

    // 1st rating for Ramesh K (4): matches 4.0 baseline -> '▬ 0.0'
    store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });
    expect(store.driverStats().find((d) => d.driverId === 'DRV-88')?.trend).toBe('▬ 0.0');

    // 2nd rating for Ramesh K (5): previous avg 4.0, new avg 4.5 -> shift +0.5 ('▲ +0.5')
    store.submit({ tripId: 'TRIP-2042', rating: 5, onTime: true });
    expect(store.driverStats().find((d) => d.driverId === 'DRV-88')?.trend).toBe('▲ +0.5');

    // 1st rating for Suresh P (2): fleet avg is (4+5+2)/3 = 3.67, Suresh avg is 2.0 -> '▼ -1.7'
    store.submit({ tripId: 'TRIP-2043', rating: 2, onTime: false });
    expect(store.driverStats().find((d) => d.driverId === 'DRV-12')?.trend).toBe('▼ -1.7');
  });
});
