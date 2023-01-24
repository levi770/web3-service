import { TransactionReceipt } from 'web3-core';
import { TxPayload } from '../interfaces/tx.interface';
import { TransactionModel } from '../../db/models/transaction.model';
export declare class TxResultDto {
    tx?: TxPayload;
    comission?: string;
    balance?: string;
    txReceipt?: TransactionReceipt;
    txObj?: TransactionModel;
}
