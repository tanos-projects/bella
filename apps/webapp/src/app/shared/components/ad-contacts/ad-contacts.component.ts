import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { Contact } from '../../models/contact.model';
import { MyDeviceService } from '../../services/my-device.service';

const APP_BRAND_NAME = 'Bellannonces.com';
@Component({
  selector: 'bella-ad-contacts',
  templateUrl: './ad-contacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AdContactsComponent {
  private deviceService = inject(MyDeviceService);

  @Input() contact: Contact | null = null;
  @Input() subject: string | null = null;
  @Input() text: string | null = null;
  @Input() link: string | null = null;
  isMobileMode = false;

  whatsAppUrl!: string;

  constructor() {
    this.isMobileMode = this.deviceService.isMobile();
  }

  whatsappMe(contact: Contact): void {
    const url = this.buildWhatsAppUrl(contact);
    window.open(url, 'no-referer');
  }

  private buildWhatsAppUrl(contact: Contact) {
    if (contact?.whatsapp) {
      let url = '';
      if (this.isMobileMode) {
        url = `${environment.contactApi.whatsappMobile}`;
      } else {
        url = `${environment.contactApi.whatsappWeb}`;
      }
      const subject = this.subject ? `"${this.subject} "` : '';
      const linkMessage = this.link ? `\n-----\nLien : ${this.link}` : '';
      const text = encodeURIComponent(
        `Bonjour, votre annonce ${subject}sur ${APP_BRAND_NAME} m'intéresse beaucoup. Est-elle toujours disponible ?${linkMessage}`
      );
      return `${url}send?phone=${contact.whatsapp}&text=${text}`;
    }
    return null;
  }

  // TODO : Utile pour le partage par whatsapp plus tard
  // const linkMessage = this.link ? `\nCliquez ici : ${this.link}` : '';
  //     const text = encodeURIComponent(
  //       `Hey, j'ai vu cette annonce ${subject}sur ${APP_BRAND_NAME} qui pourrait vous intéresser.${linkMessage}`
  //     );

  mailToMe(contact: Contact): void {
    const url = `mailto:${contact.email}?subject=${encodeURIComponent(
      this.subject || ''
    )}&body=${encodeURIComponent(this.text || '')}`;
    window.open(url, 'no-referer');
  }

  phoneToMe(contact: Contact): void {
    const url = `tel:${contact.phone}`;
    window.open(url, 'no-referer');
  }
}
