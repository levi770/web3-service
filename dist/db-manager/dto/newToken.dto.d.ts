import { Statuses } from 'aws-sdk/clients/signer';
export declare class NewTokenDto {
    status: Statuses;
    contract_id?: string;
    address: string;
    nft_number: string;
    mint_data: object;
    meta_data: object;
    mint_tx: object;
}
