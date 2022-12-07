import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { DbManagerService } from './db-manager.service';
import { WhitelistModel } from './models/whitelist.model';

@Module({
  providers: [DbManagerService],
  imports: [SequelizeModule.forFeature([ContractModel, TokenModel, WhitelistModel])],
  exports: [DbManagerService],
})
export class DbManagerModule {}
