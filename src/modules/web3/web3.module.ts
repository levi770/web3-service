import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { Web3Service } from './web3.service';
import { Web3Controller } from './web3.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';

/**
 * A module for managing web3 operations and processing jobs.
 */
@Module({
  controllers: [Web3Controller],
  providers: [Web3Service, ...CommandHandlers, ...EventHandlers],
  imports: [CqrsModule, ConfigModule, DbModule, IpfsModule],
  exports: [Web3Service],
})
export class Web3Module {}
