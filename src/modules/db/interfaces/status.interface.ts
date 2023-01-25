import { Statuses } from '../../../common/constants';

export interface Status {
  object_id: string | string[];
  status: Statuses;
  tx_hash?: string;
  tx_receipt?: any;
}
