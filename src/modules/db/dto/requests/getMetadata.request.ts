import { IsString } from 'class-validator';

/**
 * A data transfer object for passing data for new metadata.
 */
export class GetMetadataRequest {
  @IsString()
  slug: string;

  @IsString()
  id: string;
}
