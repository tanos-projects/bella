import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserEntity } from '@bella/api/domain';
import * as UserMapper from './user.mapper';

describe('UserMapper', () => {
  const model: UserEntity = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    lastname: 'Doe',
    firstname: 'John',
    mobilePhone: '+225000000',
    birthdate: new Date('1990-01-01'),
    country: 'CI',
    picture: 'http://img/jdoe.png',
  };

  describe('modelToDTO', () => {
    // Same pattern already flagged on AdMapper (CHANTIER-MODERNISATION.md
    // §1.3 point 5): a mapper in libs/api/adapters importing a Nest HTTP
    // exception. Not scoped for this Phase, but the same fix would apply
    // here too — noted for Phase 2.
    it('throws a Nest NotFoundException when the model is strictly null', () => {
      expect(() => UserMapper.modelToDTO(null as unknown as UserEntity)).toThrow(
        NotFoundException
      );
      expect(() => UserMapper.modelToDTO(null as unknown as UserEntity)).toThrow(
        'User not found'
      );
    });

    it('maps every field, defaulting falsy ones to null', () => {
      const dto = UserMapper.modelToDTO(model);

      expect(dto).toEqual({
        id: 'user-1',
        username: 'jdoe',
        email: 'jdoe@example.com',
        lastname: 'Doe',
        firstname: 'John',
        mobilePhone: '+225000000',
        birthdate: model.birthdate,
        country: 'CI',
        picture: 'http://img/jdoe.png',
      });
    });
  });

  describe('modelToProfileDTO', () => {
    it('throws a Nest NotFoundException when the model is strictly null', () => {
      expect(() =>
        UserMapper.modelToProfileDTO(null as unknown as UserEntity)
      ).toThrow(NotFoundException);
    });

    it('only exposes id/username/country/picture, dropping every other field', () => {
      const dto = UserMapper.modelToProfileDTO(model) as any;

      expect(dto).toEqual({
        id: 'user-1',
        username: 'jdoe',
        country: 'CI',
        picture: 'http://img/jdoe.png',
      });
      expect(dto.email).toBeUndefined();
      expect(dto.mobilePhone).toBeUndefined();
    });
  });

  describe('dtoToModel', () => {
    it('throws a Nest BadRequestException when the dto is strictly null', () => {
      // Note the mismatched message: the exception says "User not found"
      // even though the exception type (BadRequestException, a 400) and
      // context (mapping an inbound DTO, not a lookup) suggest a copy-paste
      // from modelToDTO's message rather than an intentional wording.
      expect(() => UserMapper.dtoToModel(null as any)).toThrow(
        BadRequestException
      );
      expect(() => UserMapper.dtoToModel(null as any)).toThrow('User not found');
    });

    it('maps the DTO fields, dropping id/picture and defaulting falsy fields to null', () => {
      const dto: any = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        lastname: 'Doe',
        firstname: 'John',
        mobilePhone: '+225000000',
        birthdate: model.birthdate,
        country: 'CI',
        picture: 'http://img/ignored.png',
      };

      const entity = UserMapper.dtoToModel(dto) as any;

      expect(entity).toEqual({
        username: 'jdoe',
        email: 'jdoe@example.com',
        lastname: 'Doe',
        firstname: 'John',
        mobilePhone: '+225000000',
        birthdate: model.birthdate,
        country: 'CI',
      });
      expect(entity.picture).toBeUndefined();
      expect(entity.id).toBeUndefined();
    });
  });

  describe('modelToDTOList', () => {
    it('maps every item through modelToDTO', () => {
      const models = [model, { ...model, id: 'user-2', username: 'asmith' }];

      expect(UserMapper.modelToDTOList(models).map((d) => d.id)).toEqual([
        'user-1',
        'user-2',
      ]);
    });

    it('propagates the NotFoundException if any item in the list is null', () => {
      expect(() =>
        UserMapper.modelToDTOList([model, null as any])
      ).toThrow(NotFoundException);
    });
  });
});
