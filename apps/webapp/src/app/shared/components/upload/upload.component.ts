import { Component, ElementRef, EventEmitter, HostListener, Input, Output, TemplateRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MyDeviceService } from '../../services/my-device.service';

@Component({
  selector: 'bella-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  // host: {
  //   '(change)': 'onChange($event.target.files)',
  //   '(blur)': 'onTouched()'
  // },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UploadComponent,
      multi: true
    }
  ]
})
export class UploadComponent /*implements ControlValueAccessor*/ {
  @Input() multiple = false;
  @Input() enabled = true;
  @Input() accept = '*';

  @Output() files = new EventEmitter<FileList | null>(true);

  modalRef?: BsModalRef;
  isMobileMode = this.deviceService.isMobile();

  // onChange = (_: any): void => {};
  // onTouched = () => {};
  // private files: FileList | null = null;

  constructor(
    private host: ElementRef<HTMLInputElement>,
    private deviceService: MyDeviceService,
    private modalService: BsModalService
  ) {}

  // @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
  //   const files = event;
  //   this.onChange(files);
  //   this.files = files;
  // }

  // writeValue(value: null) {
  //   // clear file input
  //   this.host.nativeElement.value = '';
  //   // this.files = null;
  // }

  // registerOnChange(fn: any) {
  //   this.onChange = fn;
  // }
  // registerOnTouched(fn: any) {
  //   this.onTouched = fn;
  // }

  onSelectFile(event: Event): void {
    const inputElement = <HTMLInputElement>event.target;
    this.files.emit(inputElement.files);
    // this.onChange(inputElement.files);
  }

  choosePicturesPicker(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template, { class: 'modal-dialog modal-dialog-centered' });
  }
}
