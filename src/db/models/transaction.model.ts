import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { TxPayload } from '../../web3/interfaces/tx.interface';
import { Networks } from '../../common/constants';
import { ContractModel } from './contract.model';
import { WalletModel } from './wallet.model';

/**
 * @class ContractModel - Representing a smart contract.
 * @export
 *
 * @extends {Model}
 * @property {string} id - The ID of the transaction.
 * @property {string} status - The status of the transaction.
 * @property {string} address - The address of the transaction sender.
 * @property {TxPayload} tx_payload - The payload data for the transaction.
 * @property {string} tx_hash - The transaction hash for the transaction.
 * @property {TransactionReceipt} tx_receipt - The transaction receipt from the blockchain.
 * @property {object} error - The error object if error is occurs in transaction process.
 */
@Table({ tableName: 'transactions' })
export class TransactionModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.INTEGER })
  network: Networks;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  tx_payload: TxPayload;

  @Column({ type: DataType.STRING })
  tx_hash: string;

  @Column({ type: DataType.JSON })
  tx_receipt: TransactionReceipt;

  @Column({ type: DataType.JSON })
  error: object;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @ForeignKey(() => WalletModel)
  wallet_id: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;
}
