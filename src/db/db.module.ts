import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { WhitelistModel } from './models/whitelist.model';
import { MetadataModel } from './models/metadata.model';
import { DbService } from './db.service';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';

/**
 * A module for managing database interactions.
 *
 * @export
 * @class DbManagerModule
 */
@Module({
  providers: [DbService],
  imports: [
    SequelizeModule.forFeature([
      ContractModel,
      TokenModel,
      WhitelistModel,
      MetadataModel,
      WalletModel,
      TransactionModel,
    ]),
  ],
  exports: [DbService],
})
export class DbManagerModule {}
