import { TransactionReceipt } from 'web3-core'
import { TxPayload } from '../interfaces/tx.interface'

/**
 * @class TxResultDto - A data transfer object for passing the result of a transaction.
 * @export
 * 
 * @param {TxPayload} [tx] - The transaction data.
 * @param {string} [comission] - The comission of the transaction.
 * @param {string} [balance] - The balance after the transaction.
 * @param {TransactionReceipt} [txReceipt] - The receipt of the transaction.
 */
export class TxResultDto {
  tx?: TxPayload;
  comission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
}
