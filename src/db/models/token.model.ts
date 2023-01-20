import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { MetadataModel } from './metadata.model';
import { MintDataDto } from '../../web3/dto/mintData.dto';
import { TransactionReceipt } from 'web3-eth';
import { WalletModel } from './wallet.model';

/**
 * @class TokenModel - Represents a token in the database.
 *
 * @extends Model
 * @property {string} id - Unique identifier for the token.
 * @property {string} status - Current status of the token.
 * @property {number} token_id - The unique ID of the token.
 * @property {string} address - The Ethereum address of the token.
 * @property {string} nft_number - The unique token ID in the NFT smart contract.
 * @property {MintDataDto} mint_data - Data related to the minting of the token.
 * @property {string} tx_hash - The Ethereum transaction hash for the token.
 * @property {TransactionReceipt} tx_receipt - The Ethereum transaction receipt for the token.
 * @property {string} contract_id - The ID of the contract that the token belongs to.
 * @property {ContractModel} contract - The contract that the token belongs to.
 * @property {string} metadata_id - The ID of the metadata associated with the token.
 * @property {MetadataModel} metadata - The metadata associated with the token.
 */
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

  @Column({ type: DataType.INTEGER })
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

  @ForeignKey(() => WalletModel)
  wallet_id: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;
}
