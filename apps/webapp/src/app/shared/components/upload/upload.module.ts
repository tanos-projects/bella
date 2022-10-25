import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';
// import { CloudinaryModule } from '@cloudinary/ng';

import { UploadComponent } from './upload.component';
import { UploadService } from './upload.service';

@NgModule({
  declarations: [UploadComponent],
  exports: [UploadComponent],
  providers: [UploadService],
  imports: [CommonModule, HttpClientModule /*, CloudinaryModule*/, ModalModule]
})
export class UploadModule {}
