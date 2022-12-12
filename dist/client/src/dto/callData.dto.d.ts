import { NETWORKS, OPERATIONS } from '../constants';
import { MintDataDto } from './mintData.dto';
import { WhitelistDto } from './whitelist.dto';
export declare class CallDataDto {
    network?: NETWORKS;
    contract_id: string;
    method_name: string;
    arguments: string | null;
    operation_type?: OPERATIONS;
    operation_options?: MintDataDto | WhitelistDto;
}
