import { TransactionReceipt } from 'web3-core';
import { TxPayload } from '../interfaces/tx.interface';
export declare class TxResultDto {
    tx?: TxPayload;
    comission?: string;
    balance?: string;
    txReceipt?: TransactionReceipt;
    txHash?: string;
}
