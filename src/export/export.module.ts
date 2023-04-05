import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Web3Module } from '../web3/web3.module';
import { RepositoryModule } from '../repository/repository.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [ExportController],
  providers: [ExportService],
  imports: [ConfigModule, Web3Module, RepositoryModule],
})
export class ExportModule {}
