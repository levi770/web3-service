import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { TransactionReceipt } from 'web3-eth';

/**
 * @class WhitelistModel - Representing a whitelist in the database.
 * @export
 *
 * @extends Model
 * @property {string} id - ID of the whitelist entry
 * @property {string} status - Current status of the whitelist entry
 * @property {string} tx_hash - Transaction hash of the transaction that created or modified the whitelist entry
 * @property {TransactionReceipt} tx_receipt - Transaction receipt of the transaction that created or modified the whitelist entry
 * @property {string} address - Ethereum address of the whitelist entry
 * @property {string} contract_id - ID of the contract that the whitelist entry belongs to
 * @property {ContractModel} contract - Contract model object that the whitelist entry belongs to
 */
@Table({ tableName: 'whitelist' })
export class WhitelistModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({ type: DataType.STRING })
  tx_hash: string;

  @Column({ type: DataType.JSON })
  tx_receipt: TransactionReceipt;

  @Column({ type: DataType.STRING })
  address: string;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;
}
