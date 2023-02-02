import { IsObject, IsString } from 'class-validator';
import { IMetaData } from '../../../web3/interfaces/metaData.interface';

/**
 * A data transfer object for passing data to update metadata.
 */
export class UpdateMetadataRequest {
  @IsString()
  slug: string;

  @IsString()
  token_id: string;

  @IsObject()
  meta_data: IMetaData;
}
