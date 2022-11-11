import { DeployDataDto } from './deployData.dto';
import { MintDataDto } from './mintData.dto';

export class OperationDto {
  operation: string;
  data: MintDataDto | DeployDataDto;
}
