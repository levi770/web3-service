import { ContractModel } from '../../db/models/contract.model';
import { TxResultDto } from './txResult.dto';

/**
 * A data transfer object for passing the result of a deployment.
 */
export class DeployResultDto {
  tx: TxResultDto;
  contract: ContractModel;
}
