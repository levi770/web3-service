import { DeployDataDto } from './deployData.dto';
import { MintDataDto } from './mintData.dto';
import { ContractModel } from '../models/contract.model';
import { TokenModel } from '../models/tokens.model';

type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | null;

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
