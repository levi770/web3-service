import { TransactionReceipt } from 'web3-core';
import { TxOptions } from './txOptions.interface';
import { TransactionModel } from '../../db/models/transaction.model';

/**
 * An interface for passing the result of a transaction.
 */
export interface TxResult {
  payload?: TxOptions;
  comission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
  txObj?: TransactionModel;
}
