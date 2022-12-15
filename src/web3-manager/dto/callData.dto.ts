import { MintDataDto } from './mintData.dto'
import { Networks, OperationTypes } from '../../common/constants'
import { WhitelistDto } from './whitelist.dto'


export class CallDataDto {
  execute: boolean;
  network?: Networks;
  contract_id: string;
  method_name: string;
  arguments: string | null;
  from_address?: string;
  operation_type?: OperationTypes;
  operation_options?: MintDataDto | WhitelistDto;
}
