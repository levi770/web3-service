import { IsObject, IsOptional, IsString } from 'class-validator';
import { IMetaData } from '../../web3/interfaces/metadata.interface';

/**
 * A data transfer object for passing data to update metadata.
 */
export class UpdateMetadataDto {
  @IsString()
  slug: string;

  @IsOptional()
  token_id?: number;

  @IsObject()
  meta_data: IMetaData;
}
