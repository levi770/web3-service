import FormData from 'form-data';
import { S3 } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';

/**
 * A service for managing files on IPFS.
 *
 * @export
 * @class IpfsManagerService
 */
@Injectable()
export class IpfsManagerService {
  constructor(
    @InjectAwsService(S3) private s3: S3,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Uploads a file to IPFS.
   *
   * @param {string} key - The key of the file to upload.
   * @returns {Promise<string>} A promise that resolves to the IPFS hash of the uploaded file.
   */
  async upload(key: string): Promise<string> {
    const file = await this.getObjectFromS3(key);
    return await this.uploadToPinata({ name: key, data: file });
  }

  /**
   * Gets a file from S3.
   *
   * @param {string} key - The key of the file to retrieve.
   * @returns {Promise<Buffer>} A promise that resolves to the file as a Buffer.
   * @throws {RpcException} If the file is not found or an error occurs while retrieving the file.
   */
  async getObjectFromS3(key: string): Promise<Buffer> {
    try {
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
      return object.Body as Buffer;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new RpcException('file not found');
      }
      throw new RpcException(error.message);
    }
  }

  /**
   * Uploads a file to Pinata.
   *
   * @param {{ name: string; data: Buffer }} file - The file to upload.
   * @returns {Promise<string>} A promise that resolves to the IPFS hash of the uploaded file.
   */
  async uploadToPinata(file: { name: string; data: Buffer }): Promise<string> {
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
  }
}
