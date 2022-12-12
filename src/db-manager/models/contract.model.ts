import { Column, DataType, HasMany, HasOne, Model, Table } from 'sequelize-typescript'
import { DeployDataDto } from '../../web3-manager/dto/deployData.dto'
import { MetadataModel } from './metadata.model'
import { Statuses } from '../../common/constants'
import { TokenModel } from './token.model'
import { TransactionReceipt } from 'web3-eth'
import { WhitelistModel } from './whitelist.model'


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
}
