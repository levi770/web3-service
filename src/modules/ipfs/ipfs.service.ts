import FormData from 'form-data';
import { S3 } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
import { HttpStatus, Injectable, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { MintOptionsDto } from '../web3/interfaces/mintOptions.dto';
import { DeployDto } from '../web3/dto/requests/deploy.dto';
import { IMetaData } from '../web3/interfaces/metaData.interface';
import { FileTypes } from '../../common/constants';

/**
 * A service for managing files on IPFS.
 */

@Injectable()
export class IpfsService {
  constructor(@InjectAwsService(S3) private s3: S3, private configService: ConfigService, private httpService: HttpService) {}

  /**
   * Uploads a file to IPFS.
   */
  async upload(asset_key: string): Promise<string> {
    const file = await this.getObjectFromS3(decodeURI(asset_key));
    return await this.uploadToPinata({ name: asset_key, data: file });
  }

  /**
   * Gets a file from S3.
   */
  async getObjectFromS3(key: string): Promise<Buffer> {
    try {
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
      return object.Body as Buffer;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new RpcException({
          status: error.statusCode,
          message: error.message,
        });
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Uploads a file to Pinata.
   */
  async uploadToPinata(file: { name: string; data: Buffer }): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file.data, file.name);
      const pinData = await lastValueFrom(
        this.httpService
          .post(this.configService.get('PINATA_URL') + 'pinning/pinFileToIPFS', formData, {
            maxBodyLength: Infinity,
            headers: {
              'Content-Type': `multipart/form-data; boundary=${(formData as any).getBoundary()}`,
              pinata_api_key: this.configService.get('PINATA_KEY'),
              pinata_secret_api_key: this.configService.get('PINATA_SECRET'),
            },
          })
          .pipe(map((res) => res.data)),
      );
      return pinData.IpfsHash;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Retrieves metadata for a given contract.
   */
  async buildMetadata(data: MintOptionsDto | DeployDto): Promise<IMetaData> {
    const fileId = await this.upload(data.asset_url);
    const metadata = data.meta_data;
    switch (data.asset_type) {
      case FileTypes.IMAGE:
        metadata.image = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
      case FileTypes.OBJECT:
        metadata.model_url = `${this.configService.get('PINATA_GATEWAY')}${fileId}`;
        break;
      default:
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'File type not supported',
        });
    }
    return metadata;
  }
}
