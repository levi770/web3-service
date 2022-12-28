import { AppController } from './app.controller';
import { AwsSdkModule } from 'nest-aws-sdk';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ContractModel } from './db-manager/models/contract.model';
import { DbManagerModule } from './db-manager/db-manager.module';
import { IpfsManagerModule } from './ipfs-manager/ipfs-manager.module';
import { MetadataModel } from './db-manager/models/metadata.model';
import { Logger, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokenModel } from './db-manager/models/token.model';
import { Web3ManagerModule } from './web3-manager/web3-manager.module';
import { WhitelistModel } from './db-manager/models/whitelist.model';

/**
 * A logger for logging database queries.
 * 
 * @const
 */
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
      // The models to register with the database
      models: [ContractModel, TokenModel, WhitelistModel, MetadataModel],
      // Automatically load the models
      autoLoadModels: true,
      // Synchronize the models with the database
      synchronize: true,
      // Log SQL queries
      logging: (sql: string, timing?: number) => logger.log(sql),
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
    // Import the Web3, database, and IPFS manager modules
    Web3ManagerModule,
    DbManagerModule,
    IpfsManagerModule,
  ],
  // The controllers of the application
  controllers: [AppController],
})
export class AppModule {}
