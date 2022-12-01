import { FileTypes, Networks, OperationTypes } from '../../common/constants';
import { MetaDataDto } from './metaData.dto';
import { MintDataDto } from './mintData.dto';
import { WhitelistDto } from './whitelist.dto';

export class CallDataDto {
  network?: Networks;
  contract_id: string;
  method_name: string;
  arguments: string;
  operation_type?: OperationTypes;
  operation_options?: MintDataDto | WhitelistDto;
}
