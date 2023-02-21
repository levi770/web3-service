import { AbiItem } from 'web3-utils';
import { FileTypes, Networks } from '../../../../common/constants';
import { IMetaData } from '../../interfaces/metaData.interface';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * A data transfer object for passing deploy data.
 */
export class DeployRequest {
  @IsBoolean()
  execute: boolean;

  @IsEnum(Networks)
  network: Networks;

  @IsArray()
  abi: AbiItem[];

  @IsString()
  bytecode: string;

  @IsString()
  arguments: string;

  @IsString()
  from_address: string;

  @IsString()
  slug: string;

  @IsString()
  price: string;

  @IsOptional()
  asset_url?: string;

  @IsOptional()
  asset_type?: FileTypes;

  @IsOptional()
  meta_data?: IMetaData;

  @IsOptional()
  test?: boolean;
}
