import { TxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a call.
 */
export class WhitelistResponse {
  tx: TxResult;
  root: string;
  proof: object[];
}
