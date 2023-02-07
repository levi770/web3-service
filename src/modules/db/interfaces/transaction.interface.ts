import { Networks } from '../../../common/constants';
import { ITxOptions } from '../../web3/interfaces/txOptions.interface';

/**
 * A data transfer object for passing the result of a transaction.
 */
export interface ITransaction {
  network: Networks;
  status: string;
  address: string;
  tx_payload: ITxOptions;
}
