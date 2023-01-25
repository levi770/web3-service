import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WEB3_QUEUE } from '../../common/constants';
import { DbModule } from '../db/db.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { Web3Processor } from './web3.processor';
import { Web3Service } from './web3.service';
import { Web3Controller } from './web3.controller';

/**
 * A module for managing web3 operations and processing jobs.
 */
@Module({
  controllers: [Web3Controller],
  providers: [Web3Service, Web3Processor],
  imports: [BullModule.registerQueue({ name: WEB3_QUEUE }), ConfigModule, DbModule, IpfsModule],
  exports: [Web3Service],
})
export class Web3Module {}
