import { Component } from '@angular/core';
import { concatMap, finalize } from 'rxjs/operators';
import { UploadService } from '../../shared/components/upload/upload.service';
import { AdDTO } from '../../shared/models/ads.model';
import { AdsService } from '../../shared/services/ads.service';

type ImageFile = File /*& { data: SafeUrl }*/;

@Component({
  selector: 'bella-post-an-ad',
  templateUrl: './post-an-ad.component.html',
  standalone: false,
})
export class PostAnAdComponent {
  submitting = false;

  error = false;
  postedAd!: AdDTO;
  message!: string;
  postedAdUrlPath: any[] = [];

  constructor(
    private adsService: AdsService,
    private uploadService: UploadService
  ) {}

  submit(adData: any): void {
    if (!this.submitting) {
      this.submitting = true;
      this.resetError();
      this.uploadService
        .uploadMultiple(adData.images)
        .pipe(
          concatMap((images) => this.adsService.create({ ...adData, images })),
          finalize(() => (this.submitting = false))
        )
        .subscribe({
          next: (postedAd) => {
            this.message = 'Votre annonce est bien créée !';
            this.postedAd = postedAd;
            this.postedAdUrlPath = [
              `/annonces/${postedAd.category}/`,
              this.sanitizeTitle(postedAd.title),
              postedAd.id,
            ];
          },
          error: (err) => {
            this.message = err.message;
            this.error = err;
          },
        });
    }
  }

  private resetError(): void {
    this.message = '';
    this.error = false;
  }

  // TODO Extract this to utils
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
