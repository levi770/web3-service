import { MetaDataDto } from '../../web3/dto/metaData.dto';

/**
 * A data transfer object for passing data to update metadata.
 */
export class UpdateMetadataDto {
  address: string;
  token_id: string;
  meta_data: MetaDataDto;
}
