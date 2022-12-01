import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { MintDataDto } from '../../web3-manager/dto/mintData.dto';
import { ContractModel } from './contract.model';

@Table({ tableName: 'whitelist' })
export class WhitelistModel extends Model {
  @Column({ type: DataType.STRING })
  address: string;

  @ForeignKey(() => ContractModel)
  contract_id: string;
}
