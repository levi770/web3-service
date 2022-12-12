import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { ContractModel } from './contract.model'
import { MetaDataDto } from '../../web3-manager/dto/metaData.dto'
import { MetadataModel } from './metadata.model'
import { MintDataDto } from '../../web3-manager/dto/mintData.dto'
import { TransactionReceipt } from 'web3-eth'


@Table({ tableName: 'tokens' })
export class TokenModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  status: string;

  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
  })
  token_id: number;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.STRING })
  nft_number: string;

  @Column({ type: DataType.JSON })
  mint_data: MintDataDto;

  @Column({ type: DataType.STRING })
  tx_hash: string;

  @Column({ type: DataType.JSON })
  tx_receipt: TransactionReceipt;

  @ForeignKey(() => ContractModel)
  contract_id: string;

  @BelongsTo(() => ContractModel)
  contract: ContractModel;

  @ForeignKey(() => MetadataModel)
  metadata_id: string;

  @BelongsTo(() => MetadataModel)
  metadata: MetadataModel;
}
