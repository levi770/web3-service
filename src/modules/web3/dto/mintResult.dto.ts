import { TokenModel } from '../../db/models/token.model';
import { TxResultDto } from './txResult.dto';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class MintResultDto {
  tx: TxResultDto;
  token: TokenModel;
}
