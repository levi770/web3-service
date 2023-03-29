import { FileTypes } from '../../common/constants';
import { IMetaData } from '../interfaces/metadata.interface';

/**
 * A data transfer object for passing mint data.
 */
export class MintOptionsDto {
  mint_to: string;
  qty: number;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: IMetaData;
}
