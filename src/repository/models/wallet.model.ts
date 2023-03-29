import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TokenModel } from './token.model';
import { ContractModel } from './contract.model';
import { EncryptedKeystoreV3Json } from 'web3-core';
import { TransactionModel } from './transaction.model';

/**
 * Representing a team account.
 */
@Table({ tableName: 'wallets' })
export class WalletModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  team_id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  keystore: EncryptedKeystoreV3Json;

  @HasMany(() => ContractModel)
  contracts: ContractModel[];

  @HasMany(() => TokenModel)
  tokens: TokenModel[];

  @HasMany(() => TransactionModel)
  transactions: TransactionModel[];
}
