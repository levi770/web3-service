import { TransactionReceipt } from 'web3-core';
import { ITxOptions } from './txOptions.interface';
import { TransactionModel } from '../../db/models/transaction.model';

/**
 * An interface for passing the result of a transaction.
 */
export interface ITxResult {
  payload?: ITxOptions;
  commission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
  txObj?: TransactionModel;
}
