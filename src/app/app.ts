import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeedbackFormComponent } from './components/feedback-form/feedback-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FeedbackFormComponent, DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
