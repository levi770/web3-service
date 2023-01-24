import { TransactionReceipt } from 'web3-core';
import { TxPayload } from '../interfaces/tx.interface';
import { TransactionModel } from '../../db/models/transaction.model';

/**
 * A data transfer object for passing the result of a transaction.
 */
export class TxResultDto {
  tx?: TxPayload;
  comission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
  txObj?: TransactionModel;
}
