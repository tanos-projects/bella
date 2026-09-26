import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';

import { UploadComponent } from '../../../../shared/components/upload/upload.component';

class Picture {
  get type(): string {
    return this.file.type;
  }

  constructor(public name: string, public file: File, public url: SafeUrl) {}
}

export function isFileImage(file: File): boolean {
  const filename = file.name.toLowerCase();
  return (
    ['image/jpeg', 'image/png'].includes(file.type) &&
    (filename.endsWith('.jpg') || filename.endsWith('.png'))
  );
}

function fileListToArrayFile(fileList: FileList): File[] {
  const files: File[] = [];
  for (let i = 0; i < fileList.length; ++i) {
    files.push(fileList[i]);
  }
  return files;
}

class PicturesHolder {
  private pictures: Picture[] = [];

  constructor(
    private domSanitizer: DomSanitizer,
    private maxAllowedPictures: number
  ) {}

  getLength(): number {
    return this.pictures.length;
  }

  getMaxAllowed(): number {
    return this.maxAllowedPictures;
  }

  isMaxAllowedReached(): boolean {
    return this.getLength() === this.getMaxAllowed();
  }

  remainingFilesToUpload(): number {
    return this.getMaxAllowed() - this.getLength();
  }

  getFiles(): File[] {
    return this.pictures.map((picture) => picture.file);
  }

  getPictures(): Readonly<Picture[]> {
    return this.pictures;
  }

  add(selectedFileList: FileList | null): void {
    if (selectedFileList) {
      const filesToUpload = fileListToArrayFile(selectedFileList).filter(
        (file) => isFileImage(file)
      );

      const maxRemainingFilesAllowed =
        this.maxAllowedPictures - this.pictures.length;
      const maxAllowed = Math.min(
        maxRemainingFilesAllowed,
        selectedFileList.length
      );
      this.load(this.extractMaxAllowedPictures(maxAllowed, filesToUpload));
    }
  }

  load(files: File[]): void {
    if (files?.length) {
      this.pictures.push(
        ...files.map(
          (file) =>
            new Picture(
              file.name,
              file,
              this.convertPictureFileToViewableImageUrl(file)
            )
        )
      );
    }
  }

  private extractMaxAllowedPictures(maxAllowed: number, files: File[]) {
    return files.slice(0, maxAllowed);
  }

  private convertPictureFileToViewableImageUrl(picture: File): SafeUrl {
    return this.domSanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(picture as Blob)
    );
  }

  remove(i: number): void {
    this.pictures.splice(i, 1);
  }
}

interface PictureUploaderFormFieldOptions {
  accept: string;
  limit: number;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picture-uploader-form-field',
  styles: [
    `
      .picture-viewer {
        height: 100px;
        width: 100px;
        border: 2px solid red;
        overflow: hidden;
      }
      .remove-picture {
        width: 1em;
        height: 1em;
        background-color: red;
        border-radius: 1rem;
      }

      bella-upload.max-reached {
        cursor: not-allowed;
      }
    `,
  ],
  template: `
    <div class="form-group">
      <span [class.error]="field.formControl.errors?.['images']"
        >{{ field.props['label'] }} ({{ pictureManager.getLength() }} /
        {{ pictureManager.getMaxAllowed() }})</span
      >
    </div>
    @if (pictureManager.isMaxAllowedReached()) {
      <div class="alert alert-info">
        Vous avez atteint le maximum de photos autorisé !
      </div>
    }
    @if (field.formControl.errors) {
      <div class="alert alert-danger" role="alert">
        Seules des photos JPG et PNG sont autorisées
      </div>
    }
    <div class="d-flex flex-wrap align-items-center mt-3">
      @for (picture of remainingImagePlaceHolders; track $index) {
        <div class="mx-1 mt-1">
          <bella-upload
            (files)="onFileSelected($event)"
            [multiple]="pictureManager.getMaxAllowed() > 1"
            [accept]="field.props['accept'] || ''"
            [enabled]="!pictureManager.isMaxAllowedReached()"
          ></bella-upload>
        </div>
      }
      @for (picture of pictureManager.getPictures(); track picture; let i = $index) {
        <div class="mx-1 mt-1">
          <div class="d-flex align-items-center picture-viewer rounded">
            <img
              (click)="removePicture(i)"
              (keydown.enter)="removePicture(i)"
              (keydown.space)="removePicture(i)"
              role="button"
              tabindex="0"
              [src]="picture.url"
              width="100"
              [title]="'Supprimer ' + picture.name"
              [alt]="picture.name"
            />
          </div>
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [CommonModule, UploadComponent, ReactiveFormsModule],
})
export class PictureUploaderFormFieldComponent
  extends FieldType<FieldTypeConfig & PictureUploaderFormFieldOptions>
  implements OnInit
{
  private domSanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);

  pictureManager!: PicturesHolder;

  private get allowedFilesLimit(): number {
    return this.field.props['limit'];
  }

  get remainingImagePlaceHolders(): number[] {
    let size = this.pictureManager.remainingFilesToUpload();
    if (this.pictureManager.isMaxAllowedReached()) {
      size += 1;
    }

    return new Array<number>(size);
  }

  ngOnInit() {
    this.pictureManager = new PicturesHolder(
      this.domSanitizer,
      this.allowedFilesLimit
    );
    this.pictureManager.load(this.model.images);
    this.updateFormcontrol();
  }

  onFileSelected(files: FileList | null): void {
    this.pictureManager.add(files);
    this.updateFormcontrol();
  }

  updateFormcontrol(): void {
    this.formControl.setValue(this.pictureManager.getFiles());
  }

  removePicture(i: number): void {
    this.pictureManager.remove(i);
  }
}
