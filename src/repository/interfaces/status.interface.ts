import { Statuses } from '../../common/constants';

export interface IStatus {
  object_id: string | string[];
  status: Statuses;
  tx_hash?: string;
  tx_receipt?: any;
}
