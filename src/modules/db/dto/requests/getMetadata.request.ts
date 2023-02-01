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
