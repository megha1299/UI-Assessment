import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackFormComponent } from './feedback-form.component';
import { FeedbackStore } from '../../feedback.store';

describe('FeedbackFormComponent', () => {
  let component: FeedbackFormComponent;
  let fixture: ComponentFixture<FeedbackFormComponent>;
  let store: FeedbackStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackFormComponent],
      providers: [FeedbackStore],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackFormComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(FeedbackStore);
    fixture.detectChanges();
  });

  it('should initialize with an empty form and disabled submit', () => {
    expect(component.selectedTripId()).toBe('');
    expect(component.rating()).toBe(0);
    expect(component.comment()).toBe('');
    expect(component.isSubmitDisabled()).toBe(true);
  });

  describe('Comment Character Limit Validation', () => {
    it('should consider exactly 200 characters valid', () => {
      const validComment = 'A'.repeat(200);
      component.comment.set(validComment);

      expect(component.commentLength()).toBe(200);
      expect(component.commentError()).toBeNull();
    });

    it('should consider 201 characters invalid and block submission', () => {
      const invalidComment = 'A'.repeat(201);
      component.comment.set(invalidComment);

      expect(component.commentLength()).toBe(201);
      expect(component.commentError()).toBe('Comment must be 200 characters or fewer');
      expect(component.isFormValid()).toBe(false);
      expect(component.isSubmitDisabled()).toBe(true);
    });
  });

  describe('Form Completion & Submission', () => {
    it('should enable submit only when trip and rating are provided with valid comment', () => {
      expect(component.isSubmitDisabled()).toBe(true);

      // Select trip only
      component.selectedTripId.set('TRIP-2041');
      expect(component.isSubmitDisabled()).toBe(true);

      // Set rating
      component.rating.set(4);
      expect(component.isSubmitDisabled()).toBe(false);

      // Add valid 200-char comment
      component.comment.set('A'.repeat(200));
      expect(component.isSubmitDisabled()).toBe(false);

      // Add 1 more char to make it 201
      component.comment.set('A'.repeat(201));
      expect(component.isSubmitDisabled()).toBe(true);
    });

    it('should cleanly reset all form fields after a successful submission', async () => {
      component.selectedTripId.set('TRIP-2041');
      component.rating.set(5);
      component.onTime.set(false);
      component.comment.set('Prompt and clean');
      component.markTouched('trip');
      component.markTouched('rating');

      const fakeEvent = new Event('submit');
      await component.onSubmit(fakeEvent);

      // Assert clean reset
      expect(component.selectedTripId()).toBe('');
      expect(component.rating()).toBe(0);
      expect(component.onTime()).toBe(true);
      expect(component.cabClean()).toBe(true);
      expect(component.comment()).toBe('');
      expect(component.commentLength()).toBe(0);
      expect(component.touched().trip).toBe(false);
      expect(component.touched().rating).toBe(false);
      expect(component.submitAttempted()).toBe(false);
      expect(component.successMessage()).toBe('Feedback submitted');
      expect(store.submissions().length).toBe(1);
    });

    it('should display inline duplicate error when submitting an already rated trip', async () => {
      store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });
      component.selectedTripId.set('TRIP-2041');
      component.rating.set(5);

      const fakeEvent = new Event('submit');
      await component.onSubmit(fakeEvent);

      expect(component.duplicateError()).toBe('Duplicate submission for TRIP-2041 is blocked');
    });

    it('should dismiss success message when clearSuccessMessage is called', () => {
      component.clearSuccessMessage();
      expect(component.successMessage()).toBeNull();
    });
  });
});
