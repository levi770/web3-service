import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetadataModel } from './metadata.model';
import { TransactionReceipt } from 'web3-eth';
import { WalletModel } from './wallet.model';

/**
 * Represents a token in the database.
 */
@Table({ tableName: 'tokens' })
export class TokenModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({ type: DataType.INTEGER })
  qty: number;

  @Column({ type: DataType.ARRAY(DataType.INTEGER) })
  token_ids: number[];

  @Column({ type: DataType.JSON })
  tx_receipt: TransactionReceipt;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @ForeignKey(() => MetadataModel)
  metadata_id: string;

  @BelongsTo(() => MetadataModel)
  metadata: MetadataModel;

  @ForeignKey(() => WalletModel)
  wallet_id: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;
}
