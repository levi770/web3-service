import { FileTypes, Networks, OperationTypes } from '../../common/constants';
import { MetaDataDto } from './metaData.dto';
import { MintDataDto } from './mintData.dto';

export class WhitelistDto {
  contract_id?: string;
  address: string;
}
