import { FileTypes, Networks } from '../../common/constants';
import { MetaDataDto } from './metaData.dto';

/**
 * @class MintDataDto - A data transfer object for passing mint data.
 * @export
 * 
 * @param {string} [nft_number] - The number of NFTs to mint.
 * @param {string} [mint_to] - The address to mint the NFTs to.
 * @param {string} [asset_url] - The URL of the NFT asset.
 * @param {FileTypes} [asset_type] - The type of the NFT asset.
 * @param {MetaDataDto} [meta_data] - The metadata for the NFT.
 */
export class MintDataDto {
  nft_number?: string;
  mint_to?: string;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: MetaDataDto;
}
