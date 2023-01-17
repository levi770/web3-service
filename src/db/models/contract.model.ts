import { Column, DataType, HasMany, HasOne, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { DeployDataDto } from '../../web3/dto/deployData.dto';
import { MetadataModel } from './metadata.model';
import { TokenModel } from './token.model';
import { TransactionReceipt } from 'web3-eth';
import { WhitelistModel } from './whitelist.model';
import { WalletModel } from './wallet.model';

/**
 * @class ContractModel - Representing a smart contract.
 * @export
 *
 * @extends {Model}
 * @property {string} id - The ID of the contract.
 * @property {string} status - The status of the contract.
 * @property {string} address - The address of the contract.
 * @property {DeployDataDto} deploy_data - The deploy data for the contract.
 * @property {string} tx_hash - The transaction hash for the contract deployment.
 * @property {TransactionReceipt} tx_receipt - The transaction receipt for the contract deployment.
 * @property {MetadataModel} metadata - The metadata for the contract.
 * @property {TokenModel[]} tokens - The tokens associated with the contract.
 * @property {WhitelistModel[]} whitelist - The whitelist associated with the contract.
 */
@Table({ tableName: 'contracts' })
export class ContractModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  deploy_data: DeployDataDto;

  @Column({ type: DataType.STRING })
  tx_hash: string;

  @Column({ type: DataType.JSON })
  tx_receipt: TransactionReceipt;

  @HasOne(() => MetadataModel, { onDelete: 'CASCADE' })
  metadata: MetadataModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];

  @HasMany(() => WhitelistModel, { onDelete: 'CASCADE' })
  whitelist: WhitelistModel[];

  @ForeignKey(() => WalletModel)
  wallet_id: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;
}
