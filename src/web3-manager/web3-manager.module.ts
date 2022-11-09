import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbManagerModule } from '../db-manager/db-manager.module';
import { IpfsManagerModule } from '../ipfs-manager/ipfs-manager.module';
import { Web3Processor } from './web3.processor';
import { Web3Service } from './web3.service';

@Module({
  providers: [Web3Service, Web3Processor],
  imports: [BullModule.registerQueue({ name: 'web3' }), ConfigModule, DbManagerModule, IpfsManagerModule],
  exports: [Web3Service],
})
export class Web3ManagerModule {}
