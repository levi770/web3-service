import { ContractModel } from '../../../db/models/contract.model';
import { TxResultDto\ } from '../../interfaces/txResult.dto';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class DeployResponse {
  tx: TxResultDto\;
  contract: ContractModel;
}
