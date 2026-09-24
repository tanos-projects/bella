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
    // Phase 2, sub-point 5: modelToDTO no longer decides the HTTP status
    // for "not found" - it's a pure mapper now and trusts its caller
    // (UsersController) to have already checked for null/undefined before
    // calling it, the same way it already trusted the input to be a real
    // UserEntity rather than some other shape. Calling it with null is a
    // precondition violation, not a handled case: it now throws a raw
    // TypeError instead of a controlled Nest exception.
    it('throws (a raw TypeError, not a Nest exception) when the model is strictly null', () => {
      expect(() => UserMapper.modelToDTO(null as unknown as UserEntity)).toThrow(
        TypeError
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
    it('throws (a raw TypeError, not a Nest exception) when the model is strictly null', () => {
      expect(() =>
        UserMapper.modelToProfileDTO(null as unknown as UserEntity)
      ).toThrow(TypeError);
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
    it('throws (a raw TypeError, not a Nest exception) when the dto is strictly null', () => {
      // Phase 2, sub-point 5: this used to throw a Nest BadRequestException
      // with a mismatched "User not found" message (a 400, on a mapper,
      // reading like a copy-paste from modelToDTO). The caller
      // (UsersController.updateProfile) is now responsible for rejecting a
      // null payload itself before calling dtoToModel.
      expect(() => UserMapper.dtoToModel(null as any)).toThrow(TypeError);
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

    it('propagates the TypeError if any item in the list is null', () => {
      expect(() =>
        UserMapper.modelToDTOList([model, null as any])
      ).toThrow(TypeError);
    });
  });
});
