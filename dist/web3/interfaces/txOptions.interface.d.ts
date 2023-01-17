import { Contract } from 'web3-eth-contract';
import { Networks, OperationTypes } from '../../common/constants';
import { EncryptedKeystoreV3Json } from 'web3-core';
export interface TxOptions {
    execute: boolean;
    network: Networks;
    contract: Contract;
    from_address: string;
    data: string;
    operationType?: OperationTypes;
    keystore: EncryptedKeystoreV3Json | null;
}
