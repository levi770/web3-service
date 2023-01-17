import { Contract } from 'web3-eth-contract';
import { Networks, OperationTypes } from '../../common/constants';
import { EncryptedKeystoreV3Json } from 'web3-core';

/**
 * An interface representing an object containing transaction data.
 *
 * @param {boolean} execute - Indicates whether the transaction should be executed or just simulated.
 * @param {Networks} network - The network to use for the transaction.
 * @param {Contract} contract - The contract to use for the transaction.
 * @param {string} [from_address] - The address of the sender.
 * @param {string} data - The data to send to the contract or message to sign.
 * @param {OperationTypes} [operationType] - The type of operation to perform.
 *
 * @export
 * @interface TxOptions
 */
export interface TxOptions {
  execute: boolean;
  network: Networks;
  contract: Contract;
  from_address: string;
  data: string;
  operationType?: OperationTypes;
  keystore: EncryptedKeystoreV3Json | null;
}
