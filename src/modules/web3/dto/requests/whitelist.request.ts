import { IsOptional, IsString } from 'class-validator';

/**
 * A data transfer object for passing whitelist data.
 */
export class WhitelistRequest {
  @IsString()
  contract_id: string;

  @IsString()
  addresses: string;

  @IsOptional()
  test?: boolean;
}
