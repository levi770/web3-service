import { Networks } from '../../common/constants';
import { TxPayload } from '../../web3/interfaces/tx.interface';

export class TransactionDto {
  network: Networks;
  status: string;
  address: string;
  tx_payload: TxPayload;
}
