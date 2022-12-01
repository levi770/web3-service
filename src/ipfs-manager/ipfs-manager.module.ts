import { S3 } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IpfsManagerService } from './ipfs-manager.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [IpfsManagerService],
  imports: [AwsSdkModule.forFeatures([S3]), ConfigModule, HttpModule],
  exports: [IpfsManagerService],
})
export class IpfsManagerModule {}
