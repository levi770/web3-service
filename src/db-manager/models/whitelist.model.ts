import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ContractModel } from './contract.model';

@Table({ tableName: 'whitelist' })
export class WhitelistModel extends Model {
  @Column({ type: DataType.STRING, unique: true })
  address: string;

  @ForeignKey(() => ContractModel)
  contract_id: string;
}
