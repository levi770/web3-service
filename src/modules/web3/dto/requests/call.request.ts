import { IMintData } from '../../interfaces/mintData.interface';
import { Networks, OperationTypes } from '../../../../common/constants';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { WhitelistRequest } from './whitelist.request';

/**
 * A data transfer object for passing call data.
 */
export class CallRequest {
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

  @IsEnum(OperationTypes)
  operation_type: OperationTypes;

  @IsOptional()
  operation_options?: IMintData | WhitelistRequest;

  @IsOptional()
  test: boolean;
}
