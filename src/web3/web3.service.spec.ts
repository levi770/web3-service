import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { Web3Service } from './web3.service';
import { Networks, FileTypes, OperationTypes, ProcessTypes, WEB3_QUEUE } from '../common/constants';
import { Observable } from 'rxjs';
import { getQueueToken } from '@nestjs/bull';
import { WhitelistModel } from '../db/models/whitelist.model';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let web3Queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Web3Service,
        {
          provide: getQueueToken(WEB3_QUEUE),
          useValue: {
            getJob: jest.fn(),
            add: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'ETHEREUM_HOST') {
                return 'https://eth-goerli.g.alchemy.com/v2/43grHeWbxM07sMSZ2TjTo6lw8ZZfiTXP';
              }
              if (key === 'POLYGON_HOST') {
                return 'https://polygon-mumbai.g.alchemy.com/v2/phQw1ijoZ8v01vB9iLRLywquhzKMUJv5';
              }
              if (key === 'PRIV_KEY') {
                return '45d4acb463928fb59ce13f3c203c5df3fd62beaaeaac0bb4079f93a53082eb04';
              }
            },
          },
        },
      ],
    }).compile();

    web3Service = module.get<Web3Service>(Web3Service);
    web3Queue = module.get<Queue>(getQueueToken(WEB3_QUEUE));
  });

  describe('getJob', () => {
    it('should return a job if it exists', async () => {
      const job = { id: '123' };
      (web3Queue.getJob as jest.Mock).mockResolvedValue(job);

      const result = await web3Service.getJob({ jobId: '123' });
      expect(result.status).toEqual(200);
    });

    it('should throw an error if the job does not exist', async () => {
      (web3Queue.getJob as jest.Mock).mockResolvedValue(null);
      try {
        await web3Service.getJob({ jobId: '123' });
      } catch (error) {
        expect(error.message).toEqual('Job not found');
      }
    });
  });

  describe('process', () => {
    it('should return an observable with the job status and data', async () => {
      const data = {
        execute: true,
        network: Networks.ETHEREUM,
        contract_id: '12345',
        from_address: '12345',
        method_name: 'buyFree',
        arguments: '1::[123456]',
        operation_type: OperationTypes.MINT,
        operation_options: {
          nft_number: '1',
          mint_to: '12345',
          asset_url: 'test',
          asset_type: FileTypes.IMAGE,
          meta_data: {
            name: '{{meta_data_name}}',
            description: '{{meta_data_description}}',
            attributes: [
              {
                trait_type: '{{attributes_trait_type}}',
                value: '{{attributes_trait_value}}',
              },
            ],
          },
        },
      };

      const result = await web3Service.process(data, ProcessTypes.COMMON);
      expect(result).toBeInstanceOf(Observable);
    });
  });

  describe('merkle root and merkle proof', () => {
    const whitelist = [
      { address: '0xCa8d8B211a2E1591078A3b452C1Fc43F60Ac5AfA' },
      { address: '0x4Fab890371F44c5040bd454EFe009D40ce3FF523' },
    ] as unknown as WhitelistModel[];

    it('should get merkle root', async () => {
      const root = await web3Service.getMerkleRoot(whitelist);
      expect(root).toBeDefined();
    });

    it('should get merkle proof', async () => {
      const proof = await web3Service.getMerkleProof(whitelist, '0xCa8d8B211a2E1591078A3b452C1Fc43F60Ac5AfA');
      expect(proof).toBeDefined();
    });
  });
});
