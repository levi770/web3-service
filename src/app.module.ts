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
import { Credentials } from 'aws-sdk';
import { SqsConfig, SqsConfigOption, SqsModule } from '@nestjs-packages/sqs';
import { SqsHandlerModule } from './modules/sqs/sqs.module';

//const sql_logger = new Logger('Sql');

/**
 * The root module of the application.
 */
@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.POSTGRES_URI,
      models: [ContractModel, TokenModel, WhitelistModel, MetadataModel, WalletModel, TransactionModel],
      autoLoadModels: true,
      synchronize: true,
      //logging: (sql: string) => sql_logger.log(sql),
      logging: false,
    }),
    BullModule.forRoot({
      url: process.env.REDIS_URI,
      // Alternatively, use Redis host and port
      // redis: { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT },
    }),
    AwsSdkModule.forRoot({
      defaultServiceOptions: {
        region: process.env.AWS_REGION,
        credentials: new Credentials(process.env.AWS_ACCESS_KEY, process.env.AWS_SECRET_KEY),
      },
    }),
    SqsModule.forRootAsync({
      useFactory: () => {
        const config: SqsConfigOption = {
          region: process.env.AWS_REGION,
          endpoint: process.env.SQS_ENDPOINT,
          accountNumber: process.env.AWS_ACCOUNT,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
          },
        };
        return new SqsConfig(config);
      },
    }),
    Web3Module,
    DbModule,
    IpfsModule,
    SqsHandlerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
