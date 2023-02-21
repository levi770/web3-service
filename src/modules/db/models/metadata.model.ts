import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { IMetaData } from '../../web3/interfaces/metaData.interface';
import { TokenModel } from './token.model';

/**
 * Representing metadata for contracts and tokens.
 */
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

  @Column({ type: DataType.STRING })
  slug: string;

  @Column({ type: DataType.RANGE(DataType.INTEGER) })
  token_id: number[];

  @Column({ type: DataType.JSON })
  meta_data: IMetaData;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];
}
