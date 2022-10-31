import { DeployDataDto } from './deployData.dto';
import { MintDataDto } from './mintData.dto';

export class JobResultDto {
  jobId: string;
  status: string;
  data: DeployDataDto | MintDataDto;
}
