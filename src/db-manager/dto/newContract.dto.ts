import { Statuses } from '../../common/constants'

/**
 * @class NewContractDto - A data transfer object for passing data for a new contract.
 * @export
 * 
 * @param {Statuses} status - The status of the contract.
 * @param {string} address - The address of the contract.
 * @param {object} deploy_data - The data for the contract deployment.
 * @param {object} deploy_tx - The transaction object for the contract deployment.
 */
export class NewContractDto {
  status: Statuses;
  address: string;
  deploy_data: object;
  deploy_tx: object;
}
