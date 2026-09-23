import { AdStatus } from '@bella/api/domain';
import { AdsRepositoryNest } from './ads-repository-nest';

function createQueryMock(result: unknown) {
  const query: any = {};
  query.sort = jest.fn().mockReturnValue(query);
  query.setOptions = jest.fn().mockReturnValue(query);
  query.exec = jest.fn().mockResolvedValue(result);
  return query;
}

describe('AdsRepositoryNest', () => {
  let repository: AdsRepositoryNest;
  let adModel: any;

  beforeEach(() => {
    adModel = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockResolvedValue({ ...doc, id: 'new-id' }),
    }));
    adModel.find = jest.fn();
    adModel.findById = jest.fn();
    adModel.findOne = jest.fn();
    adModel.findOneAndUpdate = jest.fn();

    repository = new AdsRepositoryNest(adModel);
  });

  describe('updateOne', () => {
    it('asks Mongoose for the post-update document', (done) => {
      adModel.findOneAndUpdate.mockReturnValue(
        Promise.resolve({ id: '1', status: AdStatus.PUBLISHED })
      );

      repository
        .updateOne('1', { status: AdStatus.PUBLISHED })
        .subscribe(() => {
          // Without `returnDocument: 'after'` this resolves with the
          // pre-update document and the caller reports the ad's previous
          // status back to the client.
          expect(adModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: '1' },
            { status: AdStatus.PUBLISHED },
            { returnDocument: 'after' }
          );
          done();
        });
    });
  });

  describe('status lookups', () => {
    beforeEach(() => {
      adModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1' }),
      });
    });

    it('findOneDraft filters on DRAFT', (done) => {
      repository.findOneDraft('1').subscribe(() => {
        expect(adModel.findOne).toHaveBeenCalledWith({
          _id: '1',
          status: AdStatus.DRAFT,
        });
        done();
      });
    });

    it('findOneUnpublished filters on SUBMITTED, matching the moderation queue', (done) => {
      repository.findOneUnpublished('1').subscribe(() => {
        expect(adModel.findOne).toHaveBeenCalledWith({
          _id: '1',
          status: AdStatus.SUBMITTED,
        });
        done();
      });
    });

    it('findOnePublished filters on PUBLISHED', (done) => {
      repository.findOnePublished('1').subscribe(() => {
        expect(adModel.findOne).toHaveBeenCalledWith({
          _id: '1',
          status: AdStatus.PUBLISHED,
        });
        done();
      });
    });
  });

  describe('findAll', () => {
    it('translates a keyword filter into a Mongo $text search', () => {
      const query = createQueryMock([]);
      adModel.find.mockReturnValue(query);

      repository.findAll({ keyword: 'bike' } as any).subscribe();

      expect(adModel.find).toHaveBeenCalledWith({ $text: { $search: 'bike' } });
    });

    it('translates minPrice/maxPrice into $gte/$lte on price', () => {
      const query = createQueryMock([]);
      adModel.find.mockReturnValue(query);

      repository.findAll({ minPrice: 10, maxPrice: 100 } as any).subscribe();

      expect(adModel.find).toHaveBeenCalledWith({
        price: { $gte: 10, $lte: 100 },
      });
    });

    it('applies the requested limit and joins populate paths', () => {
      const query = createQueryMock([]);
      adModel.find.mockReturnValue(query);

      repository.findAll({}, { limit: 5, populate: ['owner'] }).subscribe();

      expect(query.setOptions).toHaveBeenCalledWith({
        limit: 5,
        populate: 'owner',
      });
    });
  });

  describe('createNew', () => {
    it('saves a document built from the given entity', (done) => {
      repository.createNew({ title: 'ad' } as any).subscribe((result) => {
        expect(adModel).toHaveBeenCalledWith({ title: 'ad' });
        expect(result).toEqual({ title: 'ad', id: 'new-id' });
        done();
      });
    });
  });

  describe('findAllByUserId', () => {
    it('is not implemented yet', () => {
      expect(() => repository.findAllByUserId('1')).toThrow(
        'Method not implemented.'
      );
    });
  });
});
