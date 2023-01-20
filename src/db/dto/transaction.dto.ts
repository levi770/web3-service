import { Networks } from '../../common/constants';
import { TxPayload } from '../../web3/interfaces/tx.interface';

/** @class TransactionDto - A data transfer object for passing the result of a transaction.
 * @export
 * @param {Networks} network - The network chainId number.
 * @param {string} status - The status of the transaction.
 * @param {string} address - The address of the transaction sender.
 * @param {TxPayload} tx_payload - The payload data for the transaction.
 */
export class TransactionDto {
  network: Networks;
  status: string;
  address: string;
  tx_payload: TxPayload;
}
