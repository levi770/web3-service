import { IsObject, IsString } from 'class-validator';
import { MetaData } from '../../../web3/interfaces/metaData.interface';

/**
 * A data transfer object for passing data to update metadata.
 */
export class UpdateMetadataRequest {
  @IsString()
  address: string;

  @IsString()
  token_id: string;

  @IsObject()
  meta_data: MetaData;
}
