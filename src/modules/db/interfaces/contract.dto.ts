import { Statuses } from '../../../common/constants';

/**
 * A data transfer object for passing data for a new contract.
 */
export interface Contract {
  status: Statuses;
  address?: string;
  deploy_data: object;
}
