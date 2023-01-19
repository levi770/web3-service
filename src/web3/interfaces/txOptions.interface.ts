import { Contract } from 'web3-eth-contract';
import { Networks, OperationTypes } from '../../common/constants';
import { EncryptedKeystoreV3Json } from 'web3-core';
import { ContractModel } from '../../db/models/contract.model';
import { TokenModel } from '../../db/models/token.model';
import { WhitelistModel } from '../../db/models/whitelist.model';

/**
 * An interface representing an object containing transaction data.
 *
 * @param {boolean} execute - Indicates whether the transaction should be executed or just simulated.
 * @param {Networks} network - The network to use for the transaction.
 * @param {Contract} contract - The contract to use for the transaction.
 * @param {ContractModel} contractObj - The contract object from DB.
 * @param {string} from_address - The address of the sender.
 * @param {string} data - The data to send to the contract or message to sign.
 * @param {OperationTypes} operationType - The type of operation to perform.
 * @param {EncryptedKeystoreV3Json} keystore - The keystore of the sender in DB.
 *
 * @export
 * @interface TxOptions
 */
export interface TxOptions {
  execute: boolean;
  network: Networks;
  contract: Contract;
  contractObj: ContractModel;
  from_address: string;
  data: string;
  operationType: OperationTypes;
  keystore: EncryptedKeystoreV3Json | null;
  tokenObj?: TokenModel;
  whitelistObj?: WhitelistModel[];
}
