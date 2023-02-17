import { IMetaData } from '../../web3/interfaces/metaData.interface';
import { MetadataTypes, Statuses } from '../../../common/constants';
import { Range } from '../../../common/types';

/**
 * A data transfer object for passing data for new metadata.
 */
export interface IMetadata {
  id?: string;
  object_id?: string;
  type?: MetadataTypes;
  status?: Statuses;
  address?: string;
  token_id?: Range;
  meta_data?: IMetaData;
}
