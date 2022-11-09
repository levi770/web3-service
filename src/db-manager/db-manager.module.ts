import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContractModel } from '../common/models/contract.model';
import { TokenModel } from '../common/models/tokens.model';
import { DbManagerService } from './db-manager.service';

@Module({
  providers: [DbManagerService],
  imports: [SequelizeModule.forFeature([ContractModel, TokenModel])],
  exports: [DbManagerService],
})
export class DbManagerModule {}
