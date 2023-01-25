import { TokenModel } from '../../../db/models/token.model';
import { TxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class MintResponse {
  tx: TxResult;
  token: TokenModel;
}
