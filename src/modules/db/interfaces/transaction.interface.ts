import { Networks } from '../../../common/constants';
import { TxOptions } from '../../web3/interfaces/txOptions.interface';

/**
 * A data transfer object for passing the result of a transaction.
 */
export interface Transaction {
  network: Networks;
  status: string;
  address: string;
  tx_payload: TxOptions;
}
