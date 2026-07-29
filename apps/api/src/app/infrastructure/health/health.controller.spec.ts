import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      imports: [TerminusModule],
      // TerminusModule supplies the health indicators, but ConfigService comes
      // from MyConfigModule at runtime and has to be stubbed here.
      providers: [
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://issuer.test/') },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
