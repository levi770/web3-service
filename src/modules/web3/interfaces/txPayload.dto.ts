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
export class TxPayloadDto {
  execute: boolean;
  network: Networks;
  contract_inst: Contract;
  contract_model: ContractModel;
  from_address: string;
  data: string;
  operation_type: OperationTypes;
  keystore: EncryptedKeystoreV3Json | null;
  token_model?: TokenModel;
  whitelist_model?: WhitelistModel[];
  metadata_model?: MetadataModel;
  is_test?: boolean;
  value?: string;
}
