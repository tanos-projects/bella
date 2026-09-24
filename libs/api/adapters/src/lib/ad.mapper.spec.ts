import { NotFoundException } from '@nestjs/common';
import { AdEntity, AdStatus } from '@bella/api/domain';
import * as AdMapper from './ad.mapper';

describe('AdMapper', () => {
  describe('modelToDTO', () => {
    // Characterization: this is the exact behavior flagged in
    // CHANTIER-MODERNISATION.md §1.3 point 5 as a Clean Architecture
    // violation (a lib that should be a pure mapper importing a Nest HTTP
    // exception). This test locks the CURRENT behavior in place so Phase 2
    // can move the null-check to the caller without silently changing what
    // happens today. Do not "fix" this here.
    it('throws a Nest NotFoundException when the model is strictly null', () => {
      expect(() => AdMapper.modelToDTO(null as unknown as AdEntity)).toThrow(
        NotFoundException
      );
      expect(() => AdMapper.modelToDTO(null as unknown as AdEntity)).toThrow(
        'Ad not found'
      );
    });

    it('maps a full model to a DTO, including the nested owner via UserMapper', () => {
      const model: AdEntity = {
        id: 'ad-1',
        title: 'Nice bike',
        description: 'Barely used',
        price: 100,
        quality: 'good',
        category: 'bikes',
        country: 'CI',
        city: 'Abidjan',
        currency: 'XOF',
        images: [{ url: 'http://img/1.jpg' } as any],
        contactSettings: { phone: true } as any,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        owner: { id: 'user-1', username: 'jdoe' } as any,
        status: AdStatus.PUBLISHED,
        approbationMessage: 'ok',
        moderatedBy: 'mod-1',
        publishedAt: new Date('2024-01-03'),
      };

      const dto = AdMapper.modelToDTO(model);

      expect(dto).toMatchObject({
        id: 'ad-1',
        title: 'Nice bike',
        status: AdStatus.PUBLISHED,
        moderatedBy: 'mod-1',
      });
      expect(dto.owner).toMatchObject({ id: 'user-1', username: 'jdoe' });
      // Images are copied into new objects (shallow spread), not the same
      // array references, and empty/undefined images become [].
      expect(dto.images).toEqual([{ url: 'http://img/1.jpg' }]);
      expect(dto.images[0]).not.toBe(model.images[0]);
    });

    it('defaults every falsy scalar field to null (0 and empty string included)', () => {
      const model: AdEntity = {
        id: '',
        title: '',
        description: '',
        price: 0,
        quality: '',
        category: '',
        country: '',
        city: '',
        currency: '',
        images: undefined,
        contactSettings: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        // {} rather than null: a null owner would cascade into UserMapper's
        // own NotFoundException (see the dedicated test below) and abort
        // this object literal entirely before the other fields are ever
        // assigned.
        owner: {} as any,
        status: undefined,
        approbationMessage: '',
        moderatedBy: '',
        publishedAt: undefined,
      };

      const dto = AdMapper.modelToDTO(model);

      // price: 0 is a legitimate price but the `|| null` pattern coerces it
      // to null just like an absent value would be — a characterization of
      // the current (arguably buggy) falsy-coercion, not a desired result.
      expect(dto.price).toBeNull();
      expect(dto.title).toBeNull();
      expect(dto.images).toEqual([]);
    });

    it('cascades into UserMapper.modelToDTO\'s own NotFoundException when owner is null', () => {
      const model = { id: 'ad-1', owner: null } as unknown as AdEntity;

      // Not documented anywhere: a missing owner throws "User not found",
      // not anything ad-related, because the owner field is mapped inline
      // via UserMapper.modelToDTO(model.owner).
      expect(() => AdMapper.modelToDTO(model)).toThrow('User not found');
    });
  });

  describe('createDTOToModel', () => {
    it('pulls country iso2/currency off the nested country object and always resets status to null', () => {
      const dto: any = {
        title: 'Nice bike',
        description: 'Barely used',
        price: 100,
        quality: 'good',
        category: 'bikes',
        country: { iso2: 'CI', currency: 'XOF' },
        city: 'Abidjan',
        images: [{ url: 'http://img/1.jpg' }],
        contactSettings: { phone: true },
        // Even if a caller mistakenly sent a status, it's ignored: the
        // mapper hardcodes `status: null` on create.
        status: 'PUBLISHED',
      };

      const model = AdMapper.createDTOToModel(dto);

      expect(model.country).toBe('CI');
      expect(model.currency).toBe('XOF');
      expect(model.status).toBeNull();
    });

    it('defaults falsy fields to null/empty and requires a country object (throws on a bare string)', () => {
      const dto: any = {
        title: '',
        description: '',
        price: 0,
        quality: '',
        category: '',
        country: { iso2: '', currency: '' },
        city: '',
        images: undefined,
        contactSettings: undefined,
      };

      const model = AdMapper.createDTOToModel(dto);

      expect(model.country).toBeNull();
      expect(model.currency).toBeNull();
      expect(model.images).toEqual([]);

      // Characterization of a real crash risk: `country` is required to be
      // a CountryDetailedDTO object (see libs/dtos CreateAdDTO). If a caller
      // sends no country at all, `model.country.iso2` throws a TypeError
      // (reading a property of undefined) instead of degrading gracefully
      // to null like every other field on this mapper.
      expect(() =>
        AdMapper.createDTOToModel({ country: undefined } as any)
      ).toThrow(TypeError);
    });
  });

  describe('modelToDTOList', () => {
    it('maps every item through modelToDTO', () => {
      const models: AdEntity[] = [
        { id: '1', owner: { id: 'u1' } as any } as AdEntity,
        { id: '2', owner: { id: 'u2' } as any } as AdEntity,
      ];

      const dtos = AdMapper.modelToDTOList(models);

      expect(dtos.map((d) => d.id)).toEqual(['1', '2']);
    });

    it('propagates the NotFoundException if any item in the list is null', () => {
      const models = [{ id: '1', owner: {} as any } as AdEntity, null as any];

      expect(() => AdMapper.modelToDTOList(models)).toThrow(NotFoundException);
    });
  });
});
