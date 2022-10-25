import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdDTO } from '../../models/ads.model';

@Component({
  selector: 'bella-ad-card',
  templateUrl: './ad-card.component.html',
  styleUrls: ['./ad-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdCardComponent implements OnInit {
  @Input()
  data!: AdDTO;

  urlPath: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const data = this.data;
    this.urlPath = [`/annonces/${data.category}/`, this.sanitizeTitle(data.title), data.id];
  }

  goToDetail(): void {
    this.router.navigate(this.urlPath);
  }

  private sanitizeTitle(title: string): string {
    return encodeURIComponent(
      title
        ?.toLowerCase()
        .trim()
        .replace(/\s/g, '-')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
    );
  }
}
