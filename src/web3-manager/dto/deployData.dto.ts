import { Networks } from '../../common/constants';
import { AbiItem } from 'web3-utils';

export class DeployDataDto {
  network: Networks;
  abi: AbiItem[];
  bytecode: string;
  args: string;
}
