import FormData from 'form-data';
import { S3 } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
/**
 * A service for managing files on IPFS.
 *
 * @export
 * @class IpfsManagerService
 */
export class IpfsManagerService {
  /**
   * Creates an instance of IpfsManagerService.
   *
   * @param {S3} s3 - The AWS S3 service.
   * @param {ConfigService} configService - The configuration service.
   * @param {HttpService} httpService - The HTTP service.
   * 
   * @memberof IpfsManagerService
   * @constructor
   */
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
    // Retrieve the file from S3 using the provided key
    const file = await this.getObjectFromS3(key);
    // Upload the file to Pinata, passing in the file name and data as an object
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
    // Attempt to retrieve the file from S3
    try {
      // Call the getObject method of the S3 service, passing in the key and bucket name as parameters
      const object = await this.s3.getObject({ Key: key, Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
      // Return the file body as a Buffer
      return object.Body as Buffer;
    } catch (error) {
      // If the file is not found (status code 404), throw a "file not found" exception
      if (error.statusCode === 404) {
        throw new RpcException('file not found');
      }
      // Otherwise, throw a generic exception with the error message
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
    // Create a new FormData object to hold the file for uploading
    const formData = new FormData();
    // Append the file to the FormData object
    formData.append('file', file.data, file.name);

    // Make a POST request to the Pinata API to pin the file to IPFS
    // The request includes the FormData object as the body, along with the necessary headers
    const pinData = await lastValueFrom(
      this.httpService
        .post(this.configService.get('PINATA_URL') + 'pinning/pinFileToIPFS', formData, {
          maxBodyLength: Infinity,
          headers: {
            // Set the content type header to indicate that the body is a multipart/form-data form
            'Content-Type': `multipart/form-data; boundary=${(formData as any).getBoundary()}`,
            // Set the API key and secret API key headers to authenticate the request
            pinata_api_key: this.configService.get('PINATA_KEY'),
            pinata_secret_api_key: this.configService.get('PINATA_SECRET'),
          },
        })
        // Extract the data property from the response object
        .pipe(map((res) => res.data)),
    );

    // Return the IPFS hash of the pinned file
    return pinData.IpfsHash;
  }
}
