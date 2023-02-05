import { IsOptional, IsString } from 'class-validator';

/**
 * A data transfer object for creating a wallet
 */
export class CreateWalletRequest {
  @IsString()
  team_id: string;

  @IsOptional()
  test?: boolean;
}
