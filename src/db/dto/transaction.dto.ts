import { TxPayload } from '../../web3/interfaces/tx.interface';

export class TransactionDto {
  status: string;
  address: string;
  tx_payload: TxPayload;
}
