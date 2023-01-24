import { MetaDataDto } from '../../web3/dto/metaData.dto';
import { MetadataTypes, Statuses } from '../../../common/constants';

/**
 * A data transfer object for passing data for new metadata.
 */
export class MetadataDto {
  type: MetadataTypes;
  status: Statuses;
  address: string;
  contract_id?: string;
  token_id?: string;
  meta_data: MetaDataDto;
}
