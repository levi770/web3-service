import { Networks, OperationTypes } from '../../common/constants';
import { MintDataDto } from './mintData.dto';
import { WhitelistDto } from './whitelist.dto';
export declare class CallDataDto {
    network?: Networks;
    contract_id: string;
    method_name: string;
    arguments: string;
    operation_type?: OperationTypes;
    operation_options?: MintDataDto | WhitelistDto;
}
