import { MetaDataDto } from '../../web3/dto/metaData.dto';

/**
 * @class SetMetadataDto - A data transfer object for passing data to associate metadata with a model object.
 * @export
 *
 * @param {string} object_id - The ID of the model object to associate the metadata with.
 * @param {string} metadata_id - The ID of the metadata to associate with the model object.
 */
export class SetMetadataDto {
  object_id: string;
  metadata_id: string;
}
