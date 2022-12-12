import { Contract } from 'web3-eth-contract';
import { Networks, OperationTypes } from '../../common/constants';
export interface TxObj {
    execute: boolean;
    network: Networks;
    contract: Contract;
    data: string;
    operationType?: OperationTypes;
}
