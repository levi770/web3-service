import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { TxPayload } from '../../web3/interfaces/tx.interface';
import { Networks } from '../../../common/constants';
import { ContractModel } from './contract.model';
import { WalletModel } from './wallet.model';
export declare class TransactionModel extends Model {
    id: string;
    network: Networks;
    status: string;
    address: string;
    tx_payload: TxPayload;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
    error: object;
    contract_id: string;
    contract: ContractModel;
    wallet_id: string;
    wallet: WalletModel;
}
