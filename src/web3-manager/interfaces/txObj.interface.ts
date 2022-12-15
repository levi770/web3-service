import { Contract } from 'web3-eth-contract'
import { Networks, OperationTypes } from '../../common/constants'


export interface TxObj {
  execute: boolean;
  network: Networks;
  contract: Contract;
  from_address?: string;
  data: string;
  operationType?: OperationTypes;
}
