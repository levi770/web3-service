import { Networks } from '../constants';

export class DeployDataDto {
  jobId: string;
  network: Networks;
  abi: Array<object>;
  bytecode: string;
  args: Array<string>;
}
