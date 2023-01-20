import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CRON_QUEUE, TX_WORKER, WEB3_QUEUE } from '../common/constants';
import { DbManagerModule } from '../db/db.module';
import { IpfsManagerModule } from '../ipfs/ipfs.module';
import { Web3Processor } from './web3.processor';
import { Web3Service } from './web3.service';
import { join } from 'path';

/**
 * A module for managing web3 operations and processing jobs.
 *
 * @export
 * @class Web3ManagerModule
 */
@Module({
  providers: [Web3Service, Web3Processor],
  imports: [
    BullModule.registerQueue(
      { name: WEB3_QUEUE },
      {
        name: CRON_QUEUE,
        processors: [
          {
            name: TX_WORKER,
            path: join(__dirname, `../web3/worker/tx.worker.${process.env.NAME === 'base' ? 'js' : 'ts'}`),
          },
        ],
      },
    ),
    ConfigModule,
    DbManagerModule,
    IpfsManagerModule,
  ],
  exports: [Web3Service],
})
export class Web3ManagerModule {}
