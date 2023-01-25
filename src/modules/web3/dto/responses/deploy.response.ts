import { ContractModel } from '../../../db/models/contract.model';
import { TxResult } from '../../interfaces/txResult.interface';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class DeployResponse {
  tx: TxResult;
  contract: ContractModel;
}
