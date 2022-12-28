import { AppController } from './app.controller';
import { AwsSdkModule } from 'nest-aws-sdk';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ContractModel } from './db-manager/models/contract.model';
import { DbManagerModule } from './db-manager/db-manager.module';
import { IpfsManagerModule } from './ipfs-manager/ipfs-manager.module';
import { MetadataModel } from './db-manager/models/metadata.model';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModel } from './db-manager/models/token.model';
import { Web3ManagerModule } from './web3-manager/web3-manager.module';
import { WhitelistModel } from './db-manager/models/whitelist.model';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.POSTGRES_URI,
      models: [ContractModel, TokenModel, WhitelistModel, MetadataModel],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    BullModule.forRoot({
      url: process.env.REDIS_URI,
      //redis: { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT },
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
