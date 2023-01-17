import { Networks, ObjectTypes, Statuses } from '../../common/constants'
import { TransactionReceipt } from 'web3-core'

/**
 * @class UpdateStatusDto - A data transfer object for passing data to update the status of a model object.
 * @export
 * 
 * @param {Networks} network - The network chainId number.
 * @param {ObjectTypes} object_type - The type of the object to update the status for.
 * @param {string} object_id - The ID of the object to update the status for.
 * @param {string} tx_hash - The transaction hash of the status update.
 * @param {TransactionReceipt} [tx_receipt] - The transaction receipt of the status update.
 * @param {Statuses} [status] - The updated status of the object.
 */
export class UpdateStatusDto {
  network: Networks;
  object_type: ObjectTypes;
  object_id: string;
  tx_hash: string;
  tx_receipt?: TransactionReceipt;
  status?: Statuses;
}
