import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetadataModel } from './metadata.model';
import { IMintData } from '../../web3/interfaces/mintData.interface';
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
  token_id: number;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.STRING })
  nft_number: string;

  @Column({ type: DataType.JSON })
  mint_data: IMintData;

  @Column({ type: DataType.STRING })
  tx_hash: string;

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
