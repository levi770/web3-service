import { FileTypes, Networks } from '../../common/constants';
import { MetaDataDto } from './metaData.dto';
export declare class MintDataDto {
    contract_id: string;
    method_name: string;
    arguments: string;
    nft_number?: string;
    mint_to?: string;
    network?: Networks;
    asset_url?: string;
    asset_type?: FileTypes;
    meta_data?: MetaDataDto;
}
