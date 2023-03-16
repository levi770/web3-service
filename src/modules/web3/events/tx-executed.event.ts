import { TransactionReceipt } from 'web3-core';
import { TxPayloadDto } from '../interfaces/txPayload.dto';

export class TxExecutedEvent {
  constructor(public readonly data: { payload: TxPayloadDto; receipt: TransactionReceipt }) {}
}
