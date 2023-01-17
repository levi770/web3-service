import { AppController } from './app.controller';
import { AwsSdkModule } from 'nest-aws-sdk';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ContractModel } from './db/models/contract.model';
import { DbManagerModule } from './db/db.module';
import { IpfsManagerModule } from './ipfs/ipfs.module';
import { MetadataModel } from './db/models/metadata.model';
import { Logger, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModel } from './db/models/token.model';
import { Web3ManagerModule } from './web3/web3.module';
import { WhitelistModel } from './db/models/whitelist.model';
import { WalletModel } from './db/models/wallet.model';
import { TransactionModel } from './db/models/transaction.model';
import { ScheduleModule } from '@nestjs/schedule';

const logger = new Logger('Sql');

/**
 * The root module of the application.
 *
 * @export
 * @class AppModule
 */
@Module({
  // Import required modules
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      // Use PostgreSQL as the database
      dialect: 'postgres',
      // The URI of the database
      uri: process.env.POSTGRES_URI,
      models: [ContractModel, TokenModel, WhitelistModel, MetadataModel, WalletModel, TransactionModel],
      autoLoadModels: true,
      // Synchronize the models with the database
      synchronize: true,
      logging: (sql: string) => logger.log(sql),
    }),
    BullModule.forRoot({
      // The URL of the Redis server
      url: process.env.REDIS_URI,
      // Alternatively, use Redis host and port
      // redis: { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT },
    }),
    AwsSdkModule.forRoot({
      // The default options for AWS services
      defaultServiceOptions: {
        // The region to use
        region: process.env.AWS_REGION,
        // The AWS credentials
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      },
    }),
    ScheduleModule.forRoot(),
    Web3ManagerModule,
    DbManagerModule,
    IpfsManagerModule,
  ],
  // The controllers of the application
  controllers: [AppController],
})
export class AppModule {}
