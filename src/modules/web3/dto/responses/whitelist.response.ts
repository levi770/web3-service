import { ITxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a call.
 */
export class WhitelistResponse {
  tx?: ITxResult;
  root: string;
  proof: object[];
}
