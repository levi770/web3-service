import { MintDataDto } from './mintData.dto';
import { Networks, OperationTypes } from '../../common/constants';
import { WhitelistDto } from './whitelist.dto';

/**
 * @class CallDataDto - A data transfer object for passing call data.
 * @export
 *
 * @param {boolean} execute - Indicates whether the call should be executed or just simulated.
 * @param {Networks} [network] - The network to use for the call.
 * @param {string} contract_id - The ID of the contract to call.
 * @param {string} method_name - The name of the method to call.
 * @param {string | null} arguments - The double colon separated arguments to pass to the method.
 * @param {string} [from_address] - The address of the sender.
 * @param {OperationTypes} [operation_type] - The type of operation to perform.
 * @param {(MintDataDto | WhitelistDto)} [operation_options] - The options for the operation.
 */
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
