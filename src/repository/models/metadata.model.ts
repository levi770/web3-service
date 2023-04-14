import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { IMetaData } from '../../web3/interfaces/metadata.interface';
import { TokenModel } from './token.model';
import { Range } from '../../common/types';

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
  token_id: Range;

  @Column({ type: DataType.JSON })
  meta_data: IMetaData;

  @Column({ type: DataType.STRING })
  file_link: string;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];
}
