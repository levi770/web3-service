import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TokenModel } from './token.model';
import { ContractModel } from './contract.model';
import { EncryptedKeystoreV3Json } from 'web3-core';

/**
 * @class WalletModel - Representing a smart contract.
 * @export
 *
 * @extends {Model}
 * @property {string} id - The ID of the wallet.
 * @property {string} team_id - Team ID from CRM side.
 * @property {string} address - The 0 address of the wallet.
 * @property {object} keystore - The encrypted wallet keystore.
 * @property {ContractModel[]} contracts - The contracts associated with the wallet..
 * @property {TokenModel[]} tokens - The tokens associated with the wallet.
 */
@Table({ tableName: 'wallets' })
export class WalletModel extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING })
  team_id: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.JSON })
  keystore: EncryptedKeystoreV3Json;

  @HasMany(() => ContractModel)
  contracts: ContractModel[];

  @HasMany(() => TokenModel)
  tokens: TokenModel[];
}
