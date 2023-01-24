import { MetaDataDto } from '../../web3/dto/metaData.dto';
import { MetadataTypes, Statuses } from '../../../common/constants';

/**
 * A data transfer object for passing data for new metadata.
 */
export class GetMetadataDto {
  address: string;
  id: string;
}
