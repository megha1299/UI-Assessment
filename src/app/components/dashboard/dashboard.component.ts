import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { FeedbackStore } from '../../feedback.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnDestroy {
  readonly store = inject(FeedbackStore);

  // Directly consume driver statistics signal from store
  readonly drivers = this.store.driverStats;

  // Overall system-wide metrics
  readonly totalSubmissions = computed<number>(() => this.store.submissions().length);
  readonly activeTripSummary = this.store.activeTripSummary;

  readonly overallAvg = computed<number | null>(() => {
    const subs = this.store.submissions();
    if (subs.length === 0) return null;
    return subs.reduce((acc, curr) => acc + curr.rating, 0) / subs.length;
  });

  // Native Chart.js Canvas reference
  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart | null = null;

  // Dynamic reactive chart configuration
  readonly chartData = computed(() => {
    const stats = this.drivers();
    const labels = stats.map((s) => `${s.driverName} (${s.driverId})`);
    const data = stats.map((s) => (s.avg !== null ? Number(s.avg.toFixed(2)) : 0));

    // Dynamic bar colors matching health status: green (>=4.0), amber (3.5-3.99), red (<3.5), grey (unrated)
    const backgroundColor = stats.map((s) => {
      if (s.avg === null) return '#94a3b8';
      if (s.avg >= 4.0) return '#16a34a';
      if (s.avg >= 3.5) return '#eab308';
      return '#dc2626';
    });

    return {
      labels,
      datasets: [
        {
          label: 'Average Rating (\u2605)',
          data,
          backgroundColor,
          borderRadius: 6,
          barPercentage: 0.55,
        },
      ],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => {
            const val = Number(context.raw);
            return val > 0 ? `Rating: ${val.toFixed(2)} \u2605` : 'No ratings yet';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Rating (\u2605)',
          color: '#64748b',
          font: { size: 11, weight: 'bold' as const },
        },
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: { size: 11 },
        },
        grid: {
          color: '#f1f5f9',
        },
        border: {
          display: true,
          color: '#cbd5e1',
        },
      },
      x: {
        ticks: {
          color: '#334155',
          font: { size: 11, weight: '600' as const },
        },
        grid: {
          display: false,
        },
        border: {
          display: true,
          color: '#cbd5e1',
        },
      },
    },
  };

  constructor() {
    // Automatically render or update Chart.js when signals change
    effect(() => {
      const canvasRef = this.chartCanvas();
      const data = this.chartData();
      if (!canvasRef?.nativeElement) return;

      const canvas = canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (this.chartInstance) {
        this.chartInstance.data = data as any;
        this.chartInstance.update();
      } else {
        this.chartInstance = new Chart(canvas, {
          type: 'bar',
          data: data as any,
          options: this.chartOptions as any,
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
