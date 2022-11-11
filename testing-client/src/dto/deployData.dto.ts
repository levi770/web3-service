import { Networks } from '../constants';
import { AbiItem } from 'web3-utils';

export class DeployDataDto {
  network: Networks;
  abi: AbiItem[];
  bytecode: string;
  args: {
    supplyLimit: number;
    mintPrice: number;
    withdrawalWallet: string;
    name: string;
    ticker: string;
    baseURI: string;
  };
}
