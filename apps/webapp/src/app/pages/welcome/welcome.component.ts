import { Component } from '@angular/core';
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
  countries$ = this.countriesService
    .getAll()
    .pipe(finalize(() => this.loadingService.hide()));

  constructor(
    private welcomeService: WelcomeService,
    private countriesService: CountriesService,
    private loadingService: LoadingService
  ) {
    this.loadingService.show();
  }

  validate(country: string): void {
    this.welcomeService.validate({ redirect: true, country });
  }
}
