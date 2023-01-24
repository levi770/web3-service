import { Networks } from '../../../common/constants';
import { TxPayload } from '../../web3/interfaces/tx.interface';

/**
 * A data transfer object for passing the result of a transaction.
 */
export class TransactionDto {
  network: Networks;
  status: string;
  address: string;
  tx_payload: TxPayload;
}
