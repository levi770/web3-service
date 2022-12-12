import { FileTypes } from '../../common/constants';
import { MetaDataDto } from './metaData.dto';
export declare class MintDataDto {
    nft_number?: string;
    mint_to?: string;
    asset_url?: string;
    asset_type?: FileTypes;
    meta_data?: MetaDataDto;
}