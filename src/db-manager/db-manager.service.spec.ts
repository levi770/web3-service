import { TestingModule, Test } from '@nestjs/testing';
import { Statuses, ObjectTypes } from '../common/constants';
import { DbManagerService } from './db-manager.service';
import { ContractModel } from './models/contract.model';
import { MetadataModel } from './models/metadata.model';
import { TokenModel } from './models/token.model';
import { WhitelistModel } from './models/whitelist.model';
import { getModelToken } from '@nestjs/sequelize';

describe('DbManagerService', () => {
  let service: DbManagerService;

  const mockModel = {
    $add: jest.fn().mockImplementation(() => {
      return { id: 1 };
    }),
    bulkCreate: jest.fn().mockResolvedValue([{ id: 1, contract_id: 1 }]),
    findOne: jest.fn().mockResolvedValue({ id: 1 }),
    count: jest.fn().mockResolvedValue(1),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbManagerService,
        {
          provide: getModelToken(TokenModel),
          useValue: mockModel,
        },
        {
          provide: getModelToken(ContractModel),
          useValue: mockModel,
        },
        {
          provide: getModelToken(WhitelistModel),
          useValue: mockModel,
        },
        {
          provide: getModelToken(MetadataModel),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<DbManagerService>(DbManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an object', async () => {
    const result = await service.create(
      [
        {
          status: Statuses.CREATED,
          address: null,
          deploy_data: null,
          deploy_tx: null,
        },
      ],
      ObjectTypes.CONTRACT,
    );

    expect(result.length).toEqual(1);
  });
});
