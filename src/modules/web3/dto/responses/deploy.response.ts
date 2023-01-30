import { ContractModel } from '../../../db/models/contract.model';
import { ITxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class DeployResponse {
  tx: ITxResult;
  contract: ContractModel;
}
