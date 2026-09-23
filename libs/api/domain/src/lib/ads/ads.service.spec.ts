import { of } from 'rxjs';
import { AdEntity, AdStatus } from './ad.entity';
import { AdNotInExpectedStateError } from './ads.errors';
import { AdsRepository } from './ads.repository';
import { AdsService } from './ads.service';

describe('AdsService', () => {
  let service: AdsService;
  let repository: jest.Mocked<AdsRepository>;

  const baseAd: AdEntity = {
    category: 'cars',
    description: 'a nice car',
    price: 1000,
    title: 'car for sale',
    quality: 'good',
    status: AdStatus.DRAFT,
  };

  beforeEach(() => {
    repository = {
      createNew: jest.fn(),
      updateOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findAllByUserId: jest.fn(),
      findOne: jest.fn(),
      findOnePublished: jest.fn(),
      findOneUnpublished: jest.fn(),
      findOneDraft: jest.fn(),
    };
    service = new AdsService(repository);
  });

  describe('create', () => {
    it('opens the ad in SUBMITTED so it goes through moderation', () => {
      repository.createNew.mockReturnValue(of(baseAd));

      service.create(baseAd).subscribe();

      expect(repository.createNew).toHaveBeenCalledWith({
        ...baseAd,
        status: AdStatus.SUBMITTED,
      });
    });
  });

  describe('createDraft', () => {
    it('opens the ad in DRAFT', () => {
      repository.createNew.mockReturnValue(of(baseAd));

      service.createDraft(baseAd).subscribe();

      expect(repository.createNew).toHaveBeenCalledWith({
        ...baseAd,
        status: AdStatus.DRAFT,
      });
    });
  });

  describe('findAllPublished', () => {
    it('forces status to PUBLISHED and drops the "top" pseudo-category', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAllPublished({ category: 'top' }).subscribe();

      expect(repository.findAll).toHaveBeenCalledWith(
        { status: AdStatus.PUBLISHED },
        undefined
      );
    });

    it('keeps a real category filter and forwards options', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAllPublished({ category: 'cars' }, { limit: 10 }).subscribe();

      expect(repository.findAll).toHaveBeenCalledWith(
        { category: 'cars', status: AdStatus.PUBLISHED },
        { limit: 10 }
      );
    });
  });

  describe('findAllUnpublished', () => {
    it('lists the moderation queue on SUBMITTED', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAllUnpublished().subscribe();

      expect(repository.findAll).toHaveBeenCalledWith(
        { status: AdStatus.SUBMITTED },
        undefined
      );
    });

    it('forwards pagination options to the repository', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAllUnpublished({ skip: 10, limit: 5 }).subscribe();

      expect(repository.findAll).toHaveBeenCalledWith(
        { status: AdStatus.SUBMITTED },
        { skip: 10, limit: 5 }
      );
    });
  });

  describe('countUnpublished', () => {
    it('counts on SUBMITTED', () => {
      repository.count.mockReturnValue(of(3));

      service.countUnpublished().subscribe();

      expect(repository.count).toHaveBeenCalledWith({
        status: AdStatus.SUBMITTED,
      });
    });
  });

  describe('countPublished', () => {
    it('forces status to PUBLISHED and drops the "top" pseudo-category', () => {
      repository.count.mockReturnValue(of(7));

      service.countPublished({ category: 'top' } as any).subscribe();

      expect(repository.count).toHaveBeenCalledWith({
        status: AdStatus.PUBLISHED,
      });
    });
  });

  describe('transition guards', () => {
    // Each transition used to spread the result of a lookup it never checked.
    // `{...null}` is `{}`, so a missed guard still ran the update and promoted
    // the ad from whatever state it was really in.
    it('submit() rejects an ad that is not a DRAFT instead of transitioning it', (done) => {
      repository.findOneDraft.mockReturnValue(of(null));

      service.submit('42').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(AdNotInExpectedStateError);
          expect(error.expectedStatus).toBe(AdStatus.DRAFT);
          expect(repository.updateOne).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('publish() rejects an ad that is not SUBMITTED instead of transitioning it', (done) => {
      repository.findOneUnpublished.mockReturnValue(of(null));

      service.publish('42').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(AdNotInExpectedStateError);
          expect(error.expectedStatus).toBe(AdStatus.SUBMITTED);
          expect(repository.updateOne).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('reject() rejects a missing ad instead of writing a status', (done) => {
      repository.findOne.mockReturnValue(of(null));

      service.reject('42', 'not allowed').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(AdNotInExpectedStateError);
          expect(repository.updateOne).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('archive() rejects a missing ad instead of writing a status', (done) => {
      repository.findOne.mockReturnValue(of(null));

      service.archive('42', 'expired').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(AdNotInExpectedStateError);
          expect(repository.updateOne).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('submit', () => {
    it('moves a DRAFT ad to SUBMITTED, writing only the status', (done) => {
      repository.findOneDraft.mockReturnValue(of(baseAd));
      repository.updateOne.mockReturnValue(
        of({ ...baseAd, status: AdStatus.SUBMITTED })
      );

      service.submit('42').subscribe((result) => {
        expect(repository.findOneDraft).toHaveBeenCalledWith('42');
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          status: AdStatus.SUBMITTED,
        });
        expect(result.status).toBe(AdStatus.SUBMITTED);
        done();
      });
    });
  });

  describe('publish', () => {
    it('moves a SUBMITTED ad to PUBLISHED and stamps publishedAt', (done) => {
      const submitted = { ...baseAd, status: AdStatus.SUBMITTED };
      repository.findOneUnpublished.mockReturnValue(of(submitted));
      repository.updateOne.mockReturnValue(
        of({ ...submitted, status: AdStatus.PUBLISHED })
      );

      service.publish('42').subscribe((result) => {
        expect(repository.findOneUnpublished).toHaveBeenCalledWith('42');
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          status: AdStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        });
        expect(result.status).toBe(AdStatus.PUBLISHED);
        done();
      });
    });

    it('records the moderator when given one', (done) => {
      const submitted = { ...baseAd, status: AdStatus.SUBMITTED };
      repository.findOneUnpublished.mockReturnValue(of(submitted));
      repository.updateOne.mockReturnValue(of(submitted));

      service.publish('42', 'mod@bella.test').subscribe(() => {
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          status: AdStatus.PUBLISHED,
          moderatedBy: 'mod@bella.test',
          publishedAt: expect.any(Date),
        });
        done();
      });
    });
  });

  describe('reject', () => {
    it('stores the reason alongside the REJECTED status', (done) => {
      repository.findOne.mockReturnValue(of(baseAd));
      repository.updateOne.mockReturnValue(
        of({ ...baseAd, status: AdStatus.REJECTED })
      );

      service.reject('42', 'duplicate listing').subscribe(() => {
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          approbationMessage: 'duplicate listing',
          status: AdStatus.REJECTED,
        });
        done();
      });
    });

    it('records the moderator when given one', (done) => {
      repository.findOne.mockReturnValue(of(baseAd));
      repository.updateOne.mockReturnValue(of(baseAd));

      service.reject('42', 'duplicate listing', 'mod@bella.test').subscribe(() => {
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          approbationMessage: 'duplicate listing',
          status: AdStatus.REJECTED,
          moderatedBy: 'mod@bella.test',
        });
        done();
      });
    });
  });

  describe('archive', () => {
    it('stores the reason alongside the ARCHIVED status', (done) => {
      repository.findOne.mockReturnValue(of(baseAd));
      repository.updateOne.mockReturnValue(
        of({ ...baseAd, status: AdStatus.ARCHIVED })
      );

      service.archive('42', 'sold elsewhere').subscribe(() => {
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          approbationMessage: 'sold elsewhere',
          status: AdStatus.ARCHIVED,
        });
        done();
      });
    });

    it('records the moderator when given one', (done) => {
      repository.findOne.mockReturnValue(of(baseAd));
      repository.updateOne.mockReturnValue(of(baseAd));

      service.archive('42', 'sold elsewhere', 'mod@bella.test').subscribe(() => {
        expect(repository.updateOne).toHaveBeenCalledWith('42', {
          approbationMessage: 'sold elsewhere',
          status: AdStatus.ARCHIVED,
          moderatedBy: 'mod@bella.test',
        });
        done();
      });
    });
  });

  describe('findAllArchived', () => {
    it('lists REJECTED and ARCHIVED together for the audit view', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAllArchived({ limit: 10 }).subscribe();

      expect(repository.findAll).toHaveBeenCalledWith(
        { status: { $in: [AdStatus.REJECTED, AdStatus.ARCHIVED] } },
        { limit: 10 }
      );
    });
  });

  describe('countArchived', () => {
    it('counts REJECTED and ARCHIVED together', () => {
      repository.count.mockReturnValue(of(2));

      service.countArchived().subscribe();

      expect(repository.count).toHaveBeenCalledWith({
        status: { $in: [AdStatus.REJECTED, AdStatus.ARCHIVED] },
      });
    });
  });
});
