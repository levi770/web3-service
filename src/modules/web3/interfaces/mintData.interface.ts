import { IsOptional, IsString } from 'class-validator';
import { FileTypes } from '../../../common/constants';
import { MetaData } from './metaData.interface';

/**
 * A data transfer object for passing mint data.
 */
export interface MintData {
  mint_to?: string;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: MetaData;
}
