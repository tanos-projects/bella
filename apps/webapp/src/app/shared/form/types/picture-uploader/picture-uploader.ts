import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FieldType, FieldTypeConfig, FormlyFieldConfig } from '@ngx-formly/core';
import { UploadModule } from '../../../../shared/components/upload/upload.module';

class Picture {
  constructor(public name: string, public file: File, public url: SafeUrl) {}
}

class PicturesHolder {
  private pictures: Picture[] = [];

  constructor(private domSanitizer: DomSanitizer, private maxAllowedPictures: number) {}

  getLength(): number {
    return this.pictures.length;
  }

  getMaxAllowed(): number {
    return this.maxAllowedPictures;
  }

  getFiles(): File[] {
    return this.pictures.map((picture) => picture.file);
  }

  getPictures(): Readonly<Picture[]> {
    return this.pictures;
  }

  add(filesToUpload: FileList | null): void {
    if (filesToUpload) {
      const maxRemainingFilesAllowed = this.maxAllowedPictures - this.pictures.length;
      const maxAllowed = Math.min(maxRemainingFilesAllowed, filesToUpload.length);
      this.load(this.extractMaxAllowedPictures(maxAllowed, filesToUpload));
    }
  }

  load(files: File[]): void {
    if (files?.length) {
      this.pictures.push(
        ...files.map((file) => new Picture(file.name, file, this.convertPictureFileToViewableImageUrl(file)))
      );
    }
  }

  private extractMaxAllowedPictures(maxAllowed: number, files: FileList) {
    const filesList: File[] = [];
    for (let i = 0; i < maxAllowed; ++i) {
      filesList.push(files[i]);
    }
    return filesList;
  }

  private convertPictureFileToViewableImageUrl(picture: File): SafeUrl {
    return this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(picture as Blob));
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
    `
  ],
  template: `
    <div class="form-group">
      <label>{{ field.props['label'] }} ({{ pictureManager.getLength() }} / {{ pictureManager.getMaxAllowed() }})</label>
      <!-- <div class="d-flex align-items-center mt-2">
      <div *ngFor="let image of placeHolders; let i = index" class="me-3">
        <bella-upload
          [multiple]="field?.props?.limit > 1"
          [accept]="field?.props?.accept || ''"
          [enabled]="adImagesFiles.length < field?.props?.limit"
        ></bella-upload>
      </div>
    </div> -->

      <!-- <bella-upload
      (files)="onFileSelected($event)"
      [multiple]="field?.props?.limit > 1"
      [accept]="field?.props?.accept || ''"
      [enabled]="adImagesFiles.length < field?.props?.limit"
    ></bella-upload> -->
    </div>
    <div class="d-flex align-items-center mt-3">
      <div class="mx-2">
        <bella-upload
          (files)="onFileSelected($event)"
          [multiple]="pictureManager.getMaxAllowed() > 1"
          [accept]="field.props['accept'] || ''"
          [enabled]="pictureManager.getLength() < pictureManager.getMaxAllowed()"
        ></bella-upload>
      </div>
      <div *ngFor="let picture of pictureManager.getPictures(); let i = index" class="mx-2">
        <div class="d-flex align-items-center picture-viewer rounded">
          <!-- <div class="position-relative picture-viewer"> -->
          <!-- <div class="position-absolute top-0 start-100 translate-middle remove-picture"></div> -->
          <!-- <div class="position-absolute top-50 start-50 translate-middle overflow-hidden"> -->
          <img (click)="removePicture(i)" [src]="picture.url" width="100" [title]="picture.name" [alt]="picture.name" />
          <!-- </div>
        </div> -->
        </div>
      </div>
      <!-- <pre>{{ field | json }}</pre> -->
    </div>
  `
})
export class PictureUploaderFormFieldComponent
  extends FieldType<FieldTypeConfig & PictureUploaderFormFieldOptions>
  implements OnInit
{
  pictureManager!: PicturesHolder;

  // public get adImagesFiles() {
  //   return this.pictureManager.getPictures();
  // }

  private get allowedFilesLimit(): number {
    return this.field.props['limit'];
  }

  // public placeHolders: any[] = [];

  constructor(private domSanitizer: DomSanitizer, private fb: FormBuilder) {
    super();
  }

  ngOnInit() {
    // console.log(this.key);
    console.log(this.model);
    this.pictureManager = new PicturesHolder(this.domSanitizer, this.allowedFilesLimit);
    this.pictureManager.load(this.model.images);
    this.updateFormcontrol();
  }

  isValid(field: FormlyFieldConfig): boolean {
    if (field.key) {
      return Boolean(field.formControl?.valid);
    }

    return field.fieldGroup ? field.fieldGroup.every((f) => this.isValid(f)) : true;
  }

  onFileSelected(files: FileList | null): void {
    // this.loadPictures(files);
    this.pictureManager.add(files);
    this.updateFormcontrol()
    // this.uploadService.upload(filesList).subscribe((r) => {
    //   console.log(r);
    // });
  }

  updateFormcontrol(): void {

    this.formControl.setValue(this.pictureManager.getFiles());
  }

  removePicture(i: number): void {
    this.pictureManager.remove(i);
  }
}

@NgModule({
  declarations: [PictureUploaderFormFieldComponent],
  exports: [PictureUploaderFormFieldComponent],
  imports: [CommonModule, UploadModule, ReactiveFormsModule]
})
export class PictureUploaderFormFieldModule {}
