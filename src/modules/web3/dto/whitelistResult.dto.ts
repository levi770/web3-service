import { TxResultDto } from './txResult.dto';

/**
 * A data transfer object for passing the result of a call.
 */
export class WhitelistResultDto {
  tx?: TxResultDto | TxResultDto[];
  root?: string;
  proof?: object[];
}
