import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  model,
  signal,
  viewChildren,
} from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  // Two-way signal model for rating (0 means no rating)
  readonly value = model<number>(0);

  // Hover preview signal
  readonly hoverValue = signal<number>(0);

  // Active keyboard focus index (1-based, 1 to 5)
  readonly focusedStar = signal<number>(1);

  readonly stars: readonly number[] = [1, 2, 3, 4, 5];

  // Button element references for programmatic focus during arrow navigation
  private readonly starButtons = viewChildren<ElementRef<HTMLButtonElement>>('starButton');

  isStarHovered(star: number): boolean {
    const hover = this.hoverValue();
    return hover > 0 && star <= hover;
  }

  isStarActive(star: number): boolean {
    const hover = this.hoverValue();
    const current = this.value();
    return hover === 0 && star <= current;
  }

  isStarFilled(star: number): boolean {
    return this.isStarHovered(star) || this.isStarActive(star);
  }

  getTabIndex(star: number): number {
    const currentVal = this.value();
    // If rated, selected star gets tabIndex 0. Otherwise, focusedStar gets 0.
    const activeIndex = currentVal > 0 ? currentVal : this.focusedStar();
    return star === activeIndex ? 0 : -1;
  }

  onMouseEnter(star: number): void {
    this.hoverValue.set(star);
  }

  onMouseLeave(): void {
    this.hoverValue.set(0);
  }

  onFocus(star: number): void {
    this.focusedStar.set(star);
  }

  selectRating(star: number): void {
    this.value.set(star);
    this.focusedStar.set(star);
    this.hoverValue.set(0);
  }

  onKeyDown(event: KeyboardEvent, star: number): void {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        event.preventDefault();
        const next = Math.min(5, star + 1);
        this.selectRating(next);
        this.focusButton(next);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        event.preventDefault();
        const prev = Math.max(1, star - 1);
        this.selectRating(prev);
        this.focusButton(prev);
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.selectRating(1);
        this.focusButton(1);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.selectRating(5);
        this.focusButton(5);
        break;
      }
      case ' ':
      case 'Enter': {
        event.preventDefault();
        this.selectRating(star);
        break;
      }
      default:
        break;
    }
  }

  private focusButton(star: number): void {
    const buttons = this.starButtons();
    const targetBtn = buttons[star - 1];
    if (targetBtn) {
      targetBtn.nativeElement.focus();
    }
  }
}
