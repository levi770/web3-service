import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { WhitelistModel } from './models/whitelist.model';
import { MetadataModel } from './models/metadata.model';
import { RepositoryService } from './repository.service';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';
import { RepositoryController } from './repository.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { QueryHandlers } from './queries/handlers';
import { CommandHandlers } from './commands/handlers';
import { AwsSdkModule } from 'nest-aws-sdk';
import { S3 } from 'aws-sdk';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

/**
 * A module for managing database interactions.
 */
@Module({
  controllers: [RepositoryController],
  providers: [RepositoryService, ...CommandHandlers, ...QueryHandlers],
  imports: [
    CqrsModule,
    HttpModule,
    ConfigModule,
    AwsSdkModule.forFeatures([S3]),
    SequelizeModule.forFeature([ContractModel, TokenModel, WhitelistModel, MetadataModel, WalletModel, TransactionModel]),
  ],
  exports: [RepositoryService],
})
export class RepositoryModule {}
