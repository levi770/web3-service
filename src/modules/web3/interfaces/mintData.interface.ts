import { IsOptional, IsString } from 'class-validator';
import { FileTypes } from '../../../common/constants';
import { IMetaData } from './metaData.interface';

/**
 * A data transfer object for passing mint data.
 */
export interface IMintData {
  mint_to?: string;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: IMetaData;
}
