import { S3 } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
import { Injectable, InternalServerErrorException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpfsService } from './ipfs.service';

@Injectable()
export class IpfsManagerService implements OnModuleInit {
  private ipfs: any;

  constructor(@InjectAwsService(S3) private s3: S3, private configService: ConfigService) {}

  async onModuleInit() {
    this.ipfs = await new IpfsService({ url: await this.configService.get('IPFS_HTTP_API_URL') }).getNode();
  }

  async upload(key: string): Promise<string> {
    const file = await this.getObjectFromS3(key);
    return await this.uploadToIpfs({ name: key, data: file });
  }

  async getObjectFromS3(key: string): Promise<Buffer> {
    try {
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
      return object.Body as Buffer;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundException('file not found');
      }

      throw new InternalServerErrorException(error.message);
    }
  }

  async uploadToIpfs(file: { name: string; data: Buffer }): Promise<string> {
    const fileDetails = { path: file.name, content: file.data };
    const options = { wrapWithDirectory: true };

    try {
      const added = await this.ipfs.add(fileDetails, options);
      return added.cid.toString();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
