import { AppController } from './app.controller';
import { AwsSdkModule } from 'nest-aws-sdk';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ContractModel } from './modules/db/models/contract.model';
import { DbModule } from './modules/db/db.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { MetadataModel } from './modules/db/models/metadata.model';
import { Logger, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModel } from './modules/db/models/token.model';
import { Web3Module } from './modules/web3/web3.module';
import { WhitelistModel } from './modules/db/models/whitelist.model';
import { WalletModel } from './modules/db/models/wallet.model';
import { TransactionModel } from './modules/db/models/transaction.model';
import { ScheduleModule } from '@nestjs/schedule';

const logger = new Logger('Sql');

/**
 * The root module of the application.
 */
console.log('----', process.env.POSTGRES_URI);
@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.POSTGRES_URI,
      models: [ContractModel, TokenModel, WhitelistModel, MetadataModel, WalletModel, TransactionModel],
      autoLoadModels: true,
      synchronize: true,
      logging: (sql: string) => logger.log(sql),
    }),
    BullModule.forRoot({
      url: process.env.REDIS_URI,
      // Alternatively, use Redis host and port
      // redis: { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT },
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      },
    }),
    ScheduleModule.forRoot(),
    Web3Module,
    DbModule,
    IpfsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
