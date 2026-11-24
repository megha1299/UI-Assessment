import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { RatingValue, Trip } from '../../models';
import { FeedbackStore } from '../../feedback.store';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [StarRatingComponent],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackFormComponent implements OnDestroy {
  readonly store = inject(FeedbackStore);

  // Auto-dismiss timer for success message
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  // Form field signals
  readonly selectedTripId = this.store.selectedTripId;
  readonly rating = signal<number>(0);
  readonly onTime = signal<boolean>(true);
  readonly cabClean = signal<boolean>(true);
  readonly comment = signal<string>('');

  // UI state signals
  readonly isSubmitting = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly duplicateError = signal<string | null>(null);
  readonly submitAttempted = signal<boolean>(false);
  readonly touched = signal<{ trip: boolean; rating: boolean; comment: boolean }>({
    trip: false,
    rating: false,
    comment: false,
  });

  // Access store signals
  readonly trips = this.store.trips;
  readonly ratedTripIds = this.store.ratedTripIds;

  // Selected trip details
  readonly selectedTrip = computed<Trip | undefined>(() => {
    const id = this.selectedTripId();
    return this.trips().find((t) => t.tripId === id);
  });

  // Character counter
  readonly commentLength = computed<number>(() => this.comment().length);

  // Field validation computed signals
  readonly tripError = computed<string | null>(() => {
    if (!this.selectedTripId()) {
      return 'Please select a trip';
    }
    return null;
  });

  readonly ratingError = computed<string | null>(() => {
    const rating = this.rating();
    if (rating < 1 || rating > 5) {
      return 'Please choose a rating';
    }
    return null;
  });

  readonly commentError = computed<string | null>(() => {
    if (this.comment().length > 200) {
      return 'Comment must be 200 characters or fewer';
    }
    return null;
  });

  // Visibility computed signals (show after touch or submit attempt)
  readonly showTripError = computed<boolean>(() => {
    return (this.touched().trip || this.submitAttempted()) && !!this.tripError();
  });

  readonly showRatingError = computed<boolean>(() => {
    return (this.touched().rating || this.submitAttempted()) && !!this.ratingError();
  });

  readonly showCommentError = computed<boolean>(() => {
    return (this.touched().comment || this.submitAttempted()) && !!this.commentError();
  });

  readonly isFormValid = computed<boolean>(() => {
    return !this.tripError() && !this.ratingError() && !this.commentError();
  });

  readonly isSubmitDisabled = computed<boolean>(() => {
    return !this.isFormValid() || this.isSubmitting();
  });

  isTripRated(tripId: string): boolean {
    return this.ratedTripIds().has(tripId);
  }

  markTouched(field: 'trip' | 'rating' | 'comment'): void {
    this.touched.update((prev) => ({ ...prev, [field]: true }));
  }

  onTripChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTripId.set(target.value);
    this.markTouched('trip');
    this.duplicateError.set(null);
    this.successMessage.set(null);
  }

  onRatingChange(newRating: number): void {
    this.rating.set(newRating);
    this.markTouched('rating');
    this.successMessage.set(null);
  }

  setOnTime(val: boolean): void {
    this.onTime.set(val);
  }

  setCabClean(val: boolean): void {
    this.cabClean.set(val);
  }

  onCommentInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.comment.set(target.value);
    this.markTouched('comment');
    this.successMessage.set(null);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitAttempted.set(true);
    this.successMessage.set(null);
    this.duplicateError.set(null);

    if (!this.isFormValid()) {
      return;
    }

    const tripId = this.selectedTripId();
    const ratingValue = this.rating() as RatingValue;
    const onTimeValue = this.onTime();
    const cabCleanValue = this.cabClean();
    const commentValue = this.comment().trim();

    this.isSubmitting.set(true);

    try {
      // Simulate async network work with 300ms delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      this.store.submit({
        tripId,
        rating: ratingValue,
        onTime: onTimeValue,
        cabClean: cabCleanValue,
        comment: commentValue || undefined,
      });

      // Clean reset of all form state
      this.selectedTripId.set('');
      this.rating.set(0);
      this.onTime.set(true);
      this.cabClean.set(true);
      this.comment.set('');
      this.touched.set({ trip: false, rating: false, comment: false });
      this.submitAttempted.set(false);
      this.showSuccessMessage('Feedback submitted');
    } catch {
      this.duplicateError.set(`Duplicate submission for ${tripId} is blocked`);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Shows brief inline success message that automatically dismisses after 3 seconds.
   */
  private showSuccessMessage(msg: string): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successMessage.set(msg);
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
      this.successTimeout = null;
    }, 3000);
  }

  clearSuccessMessage(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = null;
    }
    this.successMessage.set(null);
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = null;
    }
  }
}
