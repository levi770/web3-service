import { MetaDataDto } from '../../web3/dto/metaData.dto';

/**
 * @class UpdateMetadataDto - A data transfer object for passing data to update metadata.
 * @export
 *
 * @param {string} id - The ID of the metadata to update.
 * @param {MetaDataDto} meta_data - The updated metadata data.
 */
export class UpdateMetadataDto {
  id: string;
  meta_data: MetaDataDto;
}
