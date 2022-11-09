import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
//import { IpfsService } from 'nestjs-ipfs';
//import { IPFS } from 'ipfs-core';

@Injectable()
export class IpfsManagerService {
  constructor(
    @InjectAwsService(S3)
    private s3: S3,
  ) //private ipfs: IPFS,
  {
    //this.ipfs = new IpfsService({ start: true }).getNode() as unknown as IPFS;
  }

  // async upload(url: string) {
  //   const file = await this.getObjectFromS3(url);
  //   return await this.uploadToIpfs({ name: null, data: file });
  // }

  async getObjectFromS3(key: string): Promise<Buffer> {
    try {
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.S3_BUCKET_NAME }).promise();
      return object.Body as Buffer;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  // async uploadToIpfs(file: { name: string; data: Buffer }) {
  //   const fileDetails = {
  //     path: 'test',
  //     content: file.data,
  //   };

  //   const options = {
  //     wrapWithDirectory: true,
  //     progress: (prog: any) => console.log(`received: ${prog}`),
  //   };

  //   try {
  //     const added = await this.ipfs.add(fileDetails, options);
  //     return added.cid.toString();
  //   } catch (error) {
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }
}
