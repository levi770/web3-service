import { DeployDataDto } from '../../web3-manager/dto/deployData.dto';
import { MintDataDto } from '../../web3-manager/dto/mintData.dto';
import { ContractModel } from '../../db-manager/models/contract.model';
import { TokenModel } from '../../db-manager/models/token.model';

/**
 * @type Data - A type representing the possible data types for the `data` field in the `JobResultDto` class.
 */
type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | string | null;

/**
 * @class JobResultDto - A data transfer object for passing job result data.
 * @export
 *
 * @param {string | number} jobId - The ID of the job.
 * @param {string} status - The status of the job.
 * @param {Data} data - The data for the job result.
 */
export class JobResultDto {
  jobId: string | number;
  status: string;
  data: Data;

  constructor(jobId: string | number, status: string, data: Data) {
    this.jobId = jobId;
    this.status = status;
    this.data = data;
  }
}
