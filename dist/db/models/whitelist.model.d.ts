import { Model } from 'sequelize-typescript';
import { ContractModel } from './contract.model';
import { TransactionReceipt } from 'web3-eth';
export declare class WhitelistModel extends Model {
    id: string;
    status: string;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
    address: string;
    contract_id: string;
    contract: ContractModel;
}
