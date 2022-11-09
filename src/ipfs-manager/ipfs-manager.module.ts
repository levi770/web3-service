import { Module } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { AwsSdkModule } from 'nest-aws-sdk';
//import { IpfsModule } from 'nestjs-ipfs';
import { IpfsManagerService } from './ipfs-manager.service';

@Module({
  providers: [IpfsManagerService],
  imports: [AwsSdkModule.forFeatures([S3])],
  exports: [IpfsManagerService],
})
export class IpfsManagerModule {}
