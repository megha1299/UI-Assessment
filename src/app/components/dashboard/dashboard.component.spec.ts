import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { FeedbackStore } from '../../feedback.store';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let store: FeedbackStore;

  beforeAll(() => {
    // Mock HTMLCanvasElement.getContext for Chart.js in jsdom test environment
    HTMLCanvasElement.prototype.getContext = () => null;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [FeedbackStore],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(FeedbackStore);
    fixture.detectChanges();
  });

  it('should initialize with all seed drivers and empty submissions', () => {
    const drivers = component.drivers();
    expect(drivers.length).toBe(2);
    expect(component.totalSubmissions()).toBe(0);
    expect(component.overallAvg()).toBeNull();
  });

  it('should compute overall average and total submissions reactively upon submission', () => {
    store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });
    store.submit({ tripId: 'TRIP-2042', rating: 5, onTime: true });

    expect(component.totalSubmissions()).toBe(2);
    expect(component.overallAvg()).toBe(4.5);
  });

  it('should derive reactive chart data and health bar colors', () => {
    const initialChart = component.chartData();
    expect(initialChart.datasets[0].data).toEqual([0, 0]);
    expect(initialChart.datasets[0].backgroundColor).toEqual(['#94a3b8', '#94a3b8']);

    store.submit({ tripId: 'TRIP-2041', rating: 4, onTime: true });
    store.submit({ tripId: 'TRIP-2043', rating: 3, onTime: false });

    const updatedChart = component.chartData();
    expect(updatedChart.datasets[0].data).toEqual([4, 3]);
    expect(updatedChart.datasets[0].backgroundColor).toEqual(['#16a34a', '#dc2626']);
  });
});
