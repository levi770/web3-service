import { TxPayload } from '../../web3/interfaces/tx.interface';
export declare class TransactionDto {
    status: string;
    address: string;
    tx_payload: TxPayload;
}
