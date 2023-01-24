import { Networks, ObjectTypes, Statuses } from '../../../common/constants';
import { TransactionReceipt } from 'web3-core';

/**
 * A data transfer object for passing data to update the status of a model object.
 */
export class UpdateStatusDto {
  object_type?: ObjectTypes;
  object_id: string | string[];
  tx_hash?: string;
  tx_receipt?: any;
  status: Statuses;
}
