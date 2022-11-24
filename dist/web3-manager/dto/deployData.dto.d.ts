import { Networks } from '../../common/constants';
import { AbiItem } from 'web3-utils';
export declare class DeployDataDto {
    network: Networks;
    abi: AbiItem[];
    bytecode: string;
    args: string;
}
