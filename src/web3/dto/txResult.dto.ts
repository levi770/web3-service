import { TransactionReceipt } from 'web3-core';
import { TxPayload } from '../interfaces/tx.interface';
import { TransactionModel } from '../../db/models/transaction.model';

/**
 * @class TxResultDto - A data transfer object for passing the result of a transaction.
 * @export
 *
 * @param {TxPayload} [tx] - The transaction data.
 * @param {string} [comission] - The comission of the transaction.
 * @param {string} [balance] - The balance after the transaction.
 * @param {TransactionReceipt} [txReceipt] - The receipt of the transaction.
 * @param {TransactionModel} [txObj] - Transaction object created in DB.
 */
export class TxResultDto {
  tx?: TxPayload;
  comission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
  txObj?: TransactionModel;
}
