import { Model } from 'sequelize-typescript';
import { TransactionReceipt } from 'web3-eth';
import { TxPayload } from '../../web3/interfaces/tx.interface';
import { Networks } from '../../common/constants';
export declare class TransactionModel extends Model {
    id: string;
    network: Networks;
    status: string;
    address: string;
    tx_payload: TxPayload;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
    error: object;
}
