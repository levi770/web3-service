import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Contract } from '../common/models/contract.model';
import { Token } from '../common/models/tokens.model';
import { DbManagerService } from './db-manager.service';

@Module({
  providers: [DbManagerService],
  imports: [SequelizeModule.forFeature([Contract, Token])],
  exports: [DbManagerService],
})
export class DbManagerModule {}
