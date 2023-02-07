import { TokenModel } from '../../../db/models/token.model';
import { ITxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class MintResponse {
  tx: ITxResult;
  token: TokenModel;
}
