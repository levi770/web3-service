import { TransactionReceipt } from 'web3-core';
export declare class TokenDto {
    status: string;
    token_id: number;
    contract_id?: string;
    address: string;
    nft_number: string;
    mint_data: object;
    meta_data: object;
    tx_hash: string;
    tx_receipt: TransactionReceipt;
}
