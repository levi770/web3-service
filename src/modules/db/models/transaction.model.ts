import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { TxOptions } from '../../web3/interfaces/txOptions.interface';
import { Networks } from '../../../common/constants';
import { ContractModel } from './contract.model';
import { WalletModel } from './wallet.model';

/**
 * Representing a transaction in the database.
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
  tx_payload: TxOptions;

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
