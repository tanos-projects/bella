import { Component, inject } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'bella-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: false,
})
export class LoadingComponent {
  private loadingService = inject(LoadingService);

  isLoading$ = this.loadingService.isLoading$;
}
