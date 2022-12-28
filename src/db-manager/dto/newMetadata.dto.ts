import { MetaDataDto } from '../../web3-manager/dto/metaData.dto'
import { MetadataTypes, Statuses } from '../../common/constants'

/**
 * @class NewMetadataDto - A data transfer object for passing data for new metadata.
 * @export
 * 
 * @param {MetadataTypes} type - The type of metadata.
 * @param {Statuses} status - The status of the metadata.
 * @param {string} [contract_id] - The ID of the contract the metadata is for.
 * @param {string} [token_id] - The token ID of the metadata.
 * @param {MetaDataDto} meta_data - The metadata data.
 */
export class NewMetadataDto {
  type: MetadataTypes;
  status: Statuses;
  contract_id?: string;
  token_id?: string;
  meta_data: MetaDataDto;
}
