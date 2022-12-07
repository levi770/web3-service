import { Networks, OperationTypes } from '../../common/constants';
import { MintDataDto } from './mintData.dto';
import { WhitelistDto } from './whitelist.dto';

export class CallDataDto {
  network?: Networks;
  contract_id: string;
  method_name: string;
  arguments: string | null;
  operation_type?: OperationTypes;
  operation_options?: MintDataDto | WhitelistDto;
}
