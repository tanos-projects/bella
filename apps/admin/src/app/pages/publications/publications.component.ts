import { Component, OnInit } from '@angular/core';
import { AdDTO } from '@bella/dtos';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'bella-publications',
  templateUrl: './publications.component.html',
})
export class PublicationsComponent implements OnInit {
  // constructor() { }

  items$ = new BehaviorSubject<AdDTO[]>([
    {
      id: '6106e7dcd288f3327bd8b7b5',
      title: 'Apparemment 4 pièces à louer',
      description:
        "Appartement de 4 pièces à louer, composé de 3 chambres dont une avec sa salle d'eau, 1 salon et salle à manger,  1 cuisine, douche, et toilette visiteur. Les plus: 2 balcons, garage privé. ",
      price: 110000,
      quality: 'VERY_GOOD',
      category: 'immobilier',
      country: 'bj',
      city: 'Cotonou',
      currency: 'XOF',
      images: [],
      // contactSettings: null,
      createdAt: new Date('2021-09-02T05:33:15.287Z'),
      // updatedAt: '2021-09-02T05:33:15.287Z',
      // owner: {
      //   id: {
      //     type: 'Buffer',
      //     data: [96, 141, 239, 36, 233, 11, 78, 48, 52, 178, 43, 171],
      //   },
      //   username: null,
      //   email: null,
      //   lastname: null,
      //   firstname: null,
      //   mobilePhone: null,
      //   birthdate: null,
      //   country: null,
      //   picture: null,
      // },
    },
    {
      id: '6136824c2283c52c18c36ae7',
      title: 'Appartement T2 à vendre',
      description:
        "Il s'agit d'un luxeux appartement T2, une chambre avec vue sur la place Goho",
      price: 1000000,
      quality: 'VERY_GOOD',
      category: 'immobilier',
      country: 'bj',
      city: 'Abomey',
      currency: 'XOF',
      images: [],
      // contactSettings: null,
      // createdAt: '2021-09-06T21:04:12.963Z',
      // updatedAt: '2021-09-06T21:04:12.963Z',
      // owner: {
      //   id: {
      //     type: 'Buffer',
      //     data: [96, 141, 239, 36, 233, 11, 78, 48, 52, 178, 43, 171],
      //   },
      //   username: null,
      //   email: null,
      //   lastname: null,
      //   firstname: null,
      //   mobilePhone: null,
      //   birthdate: null,
      //   country: null,
      //   picture: null,
      // },
    },
    {
      id: '614199711da3ca444012627e',
      title: 'Nddndndn',
      description: 'xdvxvc',
      price: 10,
      quality: 'VERY_GOOD',
      category: 'immobilier',
      country: 'bj',
      city: 'dsfdsfsd',
      currency: 'XOF',
      images: [],
      // contactSettings: null,
      // createdAt: '2021-09-15T06:57:53.838Z',
      // updatedAt: '2021-09-15T06:57:53.838Z',
      // owner: {
      //   id: {
      //     type: 'Buffer',
      //     data: [96, 141, 239, 36, 233, 11, 78, 48, 52, 178, 43, 171],
      //   },
      //   username: null,
      //   email: null,
      //   lastname: null,
      //   firstname: null,
      //   mobilePhone: null,
      //   birthdate: null,
      //   country: null,
      //   picture: null,
      // },
    },
    {
      id: '62e12f01ad5f504e1ddb6a91',
      title: 'rgdfgdfgdfgfdgfg',
      description: 'dfgdfgdfgdfgdgdfgdfgfdgdfgdf',
      price: 454,
      quality: 'VERY_GOOD',
      category: 'immobilier',
      country: 'bj',
      city: 'Cotonou',
      currency: 'XOF',
      images: [
        {
          id: 'bae1016a88609478edd57827f90a982d',
          url: 'http://res.cloudinary.com/tangazo/image/upload/v1658924800/Capture_jo8wvo.png',
        },
        {
          id: '0c8db92b69b46cc3a9da4ccda2623d9f',
          url: 'http://res.cloudinary.com/tangazo/image/upload/v1658924800/caricature_me_marwan.jpg',
        },
      ],
      // contactSettings: null,
      // createdAt: '2022-07-27T12:26:41.420Z',
      // updatedAt: '2022-07-27T12:26:41.420Z',
      // owner: {
      //   id: {
      //     type: 'Buffer',
      //     data: [96, 147, 6, 28, 32, 44, 217, 81, 56, 144, 131, 213],
      //   },
      //   username: null,
      //   email: null,
      //   lastname: null,
      //   firstname: null,
      //   mobilePhone: null,
      //   birthdate: null,
      //   country: null,
      //   picture: null,
      // },
    },
  ]);

  ngOnInit() {
    console.log('Init!');
  }
}
