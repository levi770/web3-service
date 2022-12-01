import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { MintDataDto } from '../../web3-manager/dto/mintData.dto';
import { ContractModel } from './contract.model';

@Table({ tableName: 'tokens' })
export class TokenModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.STRING, unique: true })
  nft_number: string;

  @Column({ type: DataType.JSON })
  mint_data: MintDataDto;

  @Column({ type: DataType.JSON })
  meta_data: MetaDataDto;

  @Column({ type: DataType.JSON })
  mint_tx: TransactionReceipt;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;
}
