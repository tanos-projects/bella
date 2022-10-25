import { Injectable } from '@angular/core';
import { AdDTO } from '../models/ads.model';
import { Contact } from '../models/contact.model';

// FIXME couldn't be changed into pipe instead ?
@Injectable({ providedIn: 'root' })
export class ContactService {
  getContactData(ad: AdDTO): Contact {
    const contactData: Contact = {
      phone: ad?.contactSettings?.phone === true ? ad.owner?.mobilePhone : undefined,
      whatsapp: ad?.contactSettings?.whatsapp === true ? ad.owner?.mobilePhone : undefined,
      email: ad?.contactSettings?.email === true ? ad.owner?.email : undefined
    };
    return contactData;
  }
}
