import { MetaData } from '../../web3/interfaces/metaData.interface';
import { MetadataTypes, Statuses } from '../../../common/constants';

/**
 * A data transfer object for passing data for new metadata.
 */
export interface Metadata {
  id?: string;
  object_id?: string;
  type?: MetadataTypes;
  status?: Statuses;
  address?: string;
  token_id?: string;
  meta_data?: MetaData;
}
