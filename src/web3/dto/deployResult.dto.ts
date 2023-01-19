import { ContractModel } from '../../db/models/contract.model';
import { MetaDataDto } from './metaData.dto';
import { MetadataModel } from '../../db/models/metadata.model';
import { TxResultDto } from './txResult.dto';

/**
 * @class DeployResultDto - A data transfer object for passing the result of a deployment.
 * @export
 *
 * @param {TxResultDto} [deployTx] - The transaction result of the deployment.
 * @param {MetaDataDto} [meta_data] - The metadata for the deployment.
 * @param {MetadataModel} [metadataObj] - The metadata model object for the deployment.
 * @param {ContractModel} contractObj - The contract model object for the deployment.
 */
export class DeployResultDto {
  tx?: TxResultDto;
}
