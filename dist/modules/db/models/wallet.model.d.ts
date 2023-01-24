import { Model } from 'sequelize-typescript';
import { TokenModel } from './token.model';
import { ContractModel } from './contract.model';
import { EncryptedKeystoreV3Json } from 'web3-core';
import { TransactionModel } from './transaction.model';
export declare class WalletModel extends Model {
    id: string;
    team_id: string;
    address: string;
    keystore: EncryptedKeystoreV3Json;
    contracts: ContractModel[];
    tokens: TokenModel[];
    transactions: TransactionModel[];
}
