import { AwsSdkModule } from 'nest-aws-sdk';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { Web3ManagerModule } from './web3-manager/web3-manager.module';
import { DbManagerModule } from './db-manager/db-manager.module';
import { IpfsManagerModule } from './ipfs-manager/ipfs-manager.module';
import { ContractModel } from './db-manager/models/contract.model';
import { TokenModel } from './db-manager/models/token.model';
import { WhitelistModel } from './db-manager/models/whitelist.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.POSTGRES_URI,
      models: [ContractModel, TokenModel, WhitelistModel],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    BullModule.forRoot({
      url: process.env.REDIS_URI,
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
    Web3ManagerModule,
    DbManagerModule,
    IpfsManagerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
