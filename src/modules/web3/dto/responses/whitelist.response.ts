import { TxResultDto\ } from '../../interfaces/txResult.dto';

/**
 * A data transfer object for passing the result of a call.
 */
export class WhitelistResponse {
  tx?: TxResultDto\;
  root: string;
  proof: object[];
}
