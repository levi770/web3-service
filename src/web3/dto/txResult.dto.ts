import { TransactionReceipt } from 'web3-core';
import { ITxOptions } from '../interfaces/tx-options.interface';
import { TransactionModel } from '../../repository/models/transaction.model';

/**
 * An interface for passing the result of a transaction.
 */
export class TxResultDto {
  payload?: ITxOptions;
  commission?: string;
  balance?: string;
  txReceipt?: TransactionReceipt;
  txModel?: TransactionModel;
}
