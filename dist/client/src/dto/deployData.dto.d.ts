import { NETWORKS } from '../constants';
import { AbiItem } from 'web3-utils';
export declare class DeployDataDto {
    network: NETWORKS;
    abi: AbiItem[];
    bytecode: string;
    arguments: string;
}
