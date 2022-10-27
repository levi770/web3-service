import { Module } from '@nestjs/common';
import { IpfsManagerService } from './ipfs-manager.service';

@Module({
  providers: [IpfsManagerService]
})
export class IpfsManagerModule {}
