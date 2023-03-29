import { IsOptional, IsString } from 'class-validator';
import { Networks } from '../../common/constants';

/**
 * A data transfer object for creating a wallet
 */
export class CreateWalletDto {
  @IsString()
  team_id: string;

  @IsOptional()
  test?: boolean;

  @IsOptional()
  network?: Networks;
}
