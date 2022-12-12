import { Networks } from '../../common/constants';
import { AbiItem } from 'web3-utils';
import { MetaDataDto } from './metaData.dto';
export declare class DeployDataDto {
    network: Networks;
    abi: AbiItem[];
    bytecode: string;
    arguments: string;
    metadata?: MetaDataDto;
}
