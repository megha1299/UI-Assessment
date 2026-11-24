import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with rating 0 and 5 radio buttons', () => {
    expect(component.value()).toBe(0);
    const buttons = fixture.nativeElement.querySelectorAll('button[role="radio"]');
    expect(buttons.length).toBe(5);
  });

  describe('Keyboard navigation & accessibility', () => {
    it('should increment rating on ArrowRight and ArrowUp', () => {
      // Start at star 2
      component.value.set(2);
      fixture.detectChanges();

      const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      component.onKeyDown(eventRight, 2);
      expect(component.value()).toBe(3);

      const eventUp = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
      component.onKeyDown(eventUp, 3);
      expect(component.value()).toBe(4);
    });

    it('should clamp rating to 5 when pressing ArrowRight at star 5', () => {
      component.value.set(5);
      fixture.detectChanges();

      const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      component.onKeyDown(eventRight, 5);
      expect(component.value()).toBe(5);
    });

    it('should decrement rating on ArrowLeft and ArrowDown', () => {
      component.value.set(4);
      fixture.detectChanges();

      const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
      component.onKeyDown(eventLeft, 4);
      expect(component.value()).toBe(3);

      const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
      component.onKeyDown(eventDown, 3);
      expect(component.value()).toBe(2);
    });

    it('should clamp rating to 1 when pressing ArrowLeft at star 1', () => {
      component.value.set(1);
      fixture.detectChanges();

      const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
      component.onKeyDown(eventLeft, 1);
      expect(component.value()).toBe(1);
    });

    it('should select star on Enter or Space key', () => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      component.onKeyDown(enterEvent, 4);
      expect(component.value()).toBe(4);

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      component.onKeyDown(spaceEvent, 2);
      expect(component.value()).toBe(2);
    });

    it('should jump to 1 on Home and 5 on End key', () => {
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
      component.onKeyDown(homeEvent, 3);
      expect(component.value()).toBe(1);

      const endEvent = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
      component.onKeyDown(endEvent, 1);
      expect(component.value()).toBe(5);
    });

    it('should maintain roving tabindex and aria attributes correctly', () => {
      component.value.set(3);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[role="radio"]');

      expect(buttons[0].getAttribute('tabindex')).toBe('-1');
      expect(buttons[1].getAttribute('tabindex')).toBe('-1');
      expect(buttons[2].getAttribute('tabindex')).toBe('0'); // Star 3
      expect(buttons[3].getAttribute('tabindex')).toBe('-1');
      expect(buttons[4].getAttribute('tabindex')).toBe('-1');

      expect(buttons[2].getAttribute('aria-checked')).toBe('true');
      expect(buttons[0].getAttribute('aria-checked')).toBe('false');
      expect(buttons[2].getAttribute('aria-label')).toBe('3 stars');
    });
  });
});
