import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetaDataDto } from '../../web3/dto/metaData.dto';
import { TokenModel } from './token.model';

/**
 * @class MetadataModel - Representing metadata for contracts and tokens.
 *
 * @extends Model
 * @property {string} id - ID of the metadata entry
 * @property {string} status - Current status of the metadata entry
 * @property {string} type - Type of metadata entry
 * @property {MetaDataDto} meta_data - Actual metadata object
 * @property {string} contract_id - ID of the contract that the metadata entry belongs to
 * @property {ContractModel} contract - Contract model object that the metadata entry belongs to
 * @property {TokenModel[]} tokens - Teken models array that the metadata entry belongs to
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

  @Column({ type: DataType.JSON })
  meta_data: MetaDataDto;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @HasMany(() => TokenModel, { onDelete: 'CASCADE' })
  tokens: TokenModel[];
}
