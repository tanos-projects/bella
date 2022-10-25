import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MyDeviceService } from '../../services/my-device.service';
import { environment } from '../../../../environments/environment';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'bella-ad-contacts',
  templateUrl: './ad-contacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdContactsComponent {
  @Input() contact: Contact | null = null;
  @Input() subject: string | null = null;
  @Input() text: string | null = null;
  isMobileMode = false;

  constructor(private deviceService: MyDeviceService) {
    this.isMobileMode = this.deviceService.isMobile();
  }

  whatsappMe(contact: Contact): void {
    let url = '';
    if (this.isMobileMode) {
      url = `${environment.contactApi.whatsappMobile}`;
    } else {
      url = `${environment.contactApi.whatsappWeb}`;
    }
    url = `${url}send?phone=${contact.whatsapp}&text=${encodeURIComponent((this.subject || '') + (this.text || ''))}`;
    window.open(url, 'no-referer');
  }

  mailToMe(contact: Contact): void {
    const url = `mailto:${contact.email}?subject=${encodeURIComponent(this.subject || '')}&body=${encodeURIComponent(
      this.text || ''
    )}`;
    window.open(url, 'no-referer');
  }

  phoneToMe(contact: Contact): void {
    const url = `tel:${contact.phone}`;
    window.open(url, 'no-referer');
  }
}
