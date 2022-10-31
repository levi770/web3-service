import { ProcessTypes } from '../constants';

export class DeployDataDto {
  jobId: string;
  abi: Array<object>;
  bytecode: string;
  args: Array<string>;
}
