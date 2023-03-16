import { TokenModel } from '../../../db/models/token.model';
import { TxResultDto\ } from '../../interfaces/txResult.dto';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class MintResponse {
  tx: TxResultDto\;
  token: TokenModel;
}
