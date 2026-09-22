import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../../shared/components/loading/loading.service';
import { CountriesService } from '../../shared/services/countries.service';
import { WelcomeService } from './welcome.service';

@Component({
  selector: 'bella-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false,
})
export class WelcomeComponent {
  private welcomeService = inject(WelcomeService);
  private countriesService = inject(CountriesService);
  private loadingService = inject(LoadingService);

  countries$ = this.countriesService
    .getAll()
    .pipe(finalize(() => this.loadingService.hide()));

  constructor() {
    this.loadingService.show();
  }

  validate(country: string): void {
    this.welcomeService.validate({ redirect: true, country });
  }
}
