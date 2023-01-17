import { S3 } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IpfsManagerService } from './ipfs.service';
import { HttpModule } from '@nestjs/axios';

/**
 * A module for managing Amazon S3 and Pinata IPFS interactions.
 *
 * @export
 * @class IpfsManagerModule
 */
@Module({
  providers: [IpfsManagerService],
  imports: [AwsSdkModule.forFeatures([S3]), ConfigModule, HttpModule],
  exports: [IpfsManagerService],
})
export class IpfsManagerModule {}
