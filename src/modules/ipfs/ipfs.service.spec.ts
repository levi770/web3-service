import { Test, TestingModule } from '@nestjs/testing';
import { IpfsManagerService } from './ipfs.service';
import { S3 } from 'aws-sdk';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AwsSdkModule } from 'nest-aws-sdk';

describe('IpfsManagerService', () => {
  let service: IpfsManagerService;
  let s3Object: any = undefined;
  const fileKey = 'b8dfd07f-4572-472c-b11c-a6b1354c26c6.original.Dubai.jpg';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpfsManagerService],
      imports: [
        AwsSdkModule.forRoot({
          defaultServiceOptions: {
            region: process.env.AWS_REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY,
              secretAccessKey: process.env.AWS_SECRET_KEY,
            },
          },
        }),
        AwsSdkModule.forFeatures([S3]),
        ConfigModule.forRoot(),
        HttpModule,
      ],
    }).compile();

    service = module.get<IpfsManagerService>(IpfsManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getObjectFromS3', () => {
    it('should throw an error if the object is not found in S3', async () => {
      try {
        await service.getObjectFromS3('unknown');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).toEqual('file not found');
      }
    });

    it('should return the object if it is found in S3', async () => {
      s3Object = await service.getObjectFromS3(fileKey);
      expect(s3Object).toBeDefined();
    });
  });

  describe('uploadToPinata', () => {
    it('should return the IPFS hash if the file is successfully uploaded', async () => {
      const result = await service.uploadToPinata({
        name: 'test_' + fileKey,
        data: s3Object,
      });
      expect(result).toBeDefined();
    });
  });

  describe('upload', () => {
    it('should return the IPFS hash if the file is successfully uploaded', async () => {
      const result = await service.upload(fileKey);
      expect(result).toBeDefined();
    });
  });
});
