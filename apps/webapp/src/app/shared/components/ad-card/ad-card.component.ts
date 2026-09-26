import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AdDTO } from '../../models/ads.model';

@Component({
  selector: 'bella-ad-card',
  templateUrl: './ad-card.component.html',
  styleUrls: ['./ad-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AdCardComponent implements OnInit {
  private router = inject(Router);

  @Input()
  data!: AdDTO;

  urlPath: any[] = [];

  ngOnInit(): void {
    const data = this.data;
    this.urlPath = [
      `/annonces/${data.category}/`,
      this.sanitizeTitle(data.title),
      data.id,
    ];
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
