import { MintOptionsDto } from './mint-options.dto';
import { Networks, OperationTypes } from '../../common/constants';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { WhitelistOptionsDto } from './whitelist-options.dto';

/**
 * A data transfer object for passing call data.
 */
export class CallDto {
  @IsBoolean()
  execute: boolean;

  @IsEnum(Networks)
  network: Networks;

  @IsString()
  contract_id: string;

  @IsString()
  method_name: string;

  @IsOptional()
  arguments?: string;

  @IsString()
  from_address: string;

  @IsOptional()
  value?: string;

  @IsEnum(OperationTypes)
  operation_type: OperationTypes;

  @IsOptional()
  operation_options?: MintOptionsDto | WhitelistOptionsDto;

  @IsOptional()
  test?: boolean;
}
