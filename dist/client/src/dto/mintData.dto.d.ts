import { FILETYPES } from '../constants';
import { MetaDataDto } from './metaData.dto';
export declare class MintDataDto {
    nft_number?: string;
    mint_to?: string;
    asset_url?: string;
    asset_type?: FILETYPES;
    meta_data?: MetaDataDto;
}
