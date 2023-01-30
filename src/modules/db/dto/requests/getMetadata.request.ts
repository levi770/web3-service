import { IMetaData } from '../../../web3/interfaces/metaData.interface';
import { MetadataTypes, Statuses } from '../../../../common/constants';
import { IsString } from 'class-validator';

/**
 * A data transfer object for passing data for new metadata.
 */
export class GetMetadataRequest {
  @IsString()
  address: string;

  @IsString()
  id: string;
}
