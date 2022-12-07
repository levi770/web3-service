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
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [ContractModel, TokenModel, WhitelistModel],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
      },
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
