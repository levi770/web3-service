import { Contract } from 'web3-eth-contract';
import { Networks, OperationTypes } from '../../../common/constants';
import { EncryptedKeystoreV3Json } from 'web3-core';
import { ContractModel } from '../../db/models/contract.model';
import { TokenModel } from '../../db/models/token.model';
import { WhitelistModel } from '../../db/models/whitelist.model';
import { MetadataModel } from '../../db/models/metadata.model';

/**
 * An interface representing an object containing transaction data.
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
  metadataObj?: MetadataModel;
}
