import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { of } from 'rxjs';
import { forkJoin } from 'rxjs';
// import { Cloudinary, CloudinaryImage } from '@cloudinary/url-gen';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const CLOUDINARY_CLOUD_NAME = 'tangazo';
export const CLOUDINARY_API_BASE = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryUploadResponse {
  access_mode: string;
  asset_id: string;
  bytes: number;
  created_at: string;
  etag: string;
  existing: boolean;
  format: string;
  height: number;
  original_filename: string;
  placeholder: boolean;
  public_id: string;
  resource_type: string;
  secure_url: string;
  signature: string;
  tags: string[];
  type: string;
  url: string;
  version: number;
  version_id: string;
  width: number;
}

export interface UploadedFile {
  id: string;
  url: string;
}

@Injectable()
export class UploadService {
  private http = inject(HttpClient);

  // cld: Cloudinary;
  // constructor() {
  //   this.cld = new Cloudinary({
  //     cloud: {
  //       cloudName: CLOUDINARY_CLOUD_NAME
  //     }
  //   });
  // }

  upload(file: File): Observable<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'us_preset');
    // formData.append('timestamp', '1657266203');
    // // formData.append('timestamp', `${Date.now()}`);
    // formData.append('api_key', '961661357475955');
    // formData.append('signature', '27c0976f69fd9af4f76b4b946ad923d49de708c0d0bd648468e49307e540d0e6');

    return this.http.post<CloudinaryUploadResponse>(CLOUDINARY_API_BASE, formData).pipe(
      map((response) => ({
        id: response.asset_id,
        url: response.url
      }))
    );
  }

  uploadMultiple(files: File[]): Observable<UploadedFile[]> {
    return files?.length ? forkJoin(files.map((file) => this.upload(file))) : of([]);
  }
}
