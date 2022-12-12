import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { ContractModel } from './contract.model'
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto'
import { MintDataDto } from '../../web3-manager/dto/mintData.dto'
import { TokenModel } from './token.model'
import { TransactionReceipt } from 'web3-eth'


@Table({ tableName: 'metadata' })
export class MetadataModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({ type: DataType.STRING })
  type: string;

  @Column({ type: DataType.JSON })
  meta_data: MetaDataDto;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];
}
