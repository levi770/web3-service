import { Column, DataType, HasMany, HasOne, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { DeployDataDto } from '../../web3/dto/deployData.dto';
import { MetadataModel } from './metadata.model';
import { TokenModel } from './token.model';
import { WhitelistModel } from './whitelist.model';
import { WalletModel } from './wallet.model';
import { TransactionModel } from './transaction.model';

/**
 * Representing a smart contract.
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

  @HasOne(() => MetadataModel, { onDelete: 'CASCADE' })
  metadata: MetadataModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];

  @HasMany(() => TransactionModel, { onDelete: 'CASCADE' })
  transactions: TransactionModel[];

  @HasMany(() => WhitelistModel, { onDelete: 'CASCADE' })
  whitelist: WhitelistModel[];

  @ForeignKey(() => WalletModel)
  wallet_id: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;
}
