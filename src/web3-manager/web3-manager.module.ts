import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbManagerModule } from '../db-manager/db-manager.module';
import { Web3ManagerService } from './web3-manager.service';

@Module({
  providers: [Web3ManagerService],
  imports: [ConfigModule, DbManagerModule],
})
export class Web3ManagerModule {}
