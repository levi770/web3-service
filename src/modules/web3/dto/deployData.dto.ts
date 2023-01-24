import { AbiItem } from 'web3-utils';
import { FileTypes, Networks } from '../../../common/constants';
import { MetaDataDto } from './metaData.dto';

/**
 * A data transfer object for passing deploy data.
 */
export class DeployDataDto {
  execute: boolean;
  network: Networks;
  abi: AbiItem[];
  bytecode: string;
  arguments: string;
  from_address?: string;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: MetaDataDto;
}
