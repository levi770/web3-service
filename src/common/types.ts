import { IContract } from '../modules/db/interfaces/contract.interface';
import { IMetadata } from '../modules/db/interfaces/metadata.interface';
import { IToken } from '../modules/db/interfaces/token.interface';
import { ITransaction } from '../modules/db/interfaces/transaction.interface';
import { IWallet } from '../modules/db/interfaces/wallet.interface';
import { ContractModel } from '../modules/db/models/contract.model';
import { MetadataModel } from '../modules/db/models/metadata.model';
import { TokenModel } from '../modules/db/models/token.model';
import { TransactionModel } from '../modules/db/models/transaction.model';
import { WalletModel } from '../modules/db/models/wallet.model';
import { WhitelistModel } from '../modules/db/models/whitelist.model';
import { CallRequest } from '../modules/web3/dto/requests/call.request';
import { CreateWalletRequest } from '../modules/web3/dto/requests/createWallet.request';
import { DeployRequest } from '../modules/web3/dto/requests/deploy.request';
import { IMintOptions } from '../modules/web3/interfaces/mintOptions.interface';
import { WhitelistRequest } from '../modules/web3/dto/requests/whitelist.request';

export type Data = DeployRequest | IMintOptions | ContractModel | TokenModel | IWallet | string | null;
export type ProcessData = CreateWalletRequest | CallRequest | DeployRequest | WhitelistRequest;

export type CreateObjects = IContract[] | IToken[] | WhitelistRequest[] | IMetadata[] | IWallet[] | ITransaction[];

export type CreatedObjects =
  | ContractModel[]
  | TokenModel[]
  | WhitelistModel[]
  | MetadataModel[]
  | WalletModel[]
  | TransactionModel[];

export type ModelResponse =
  | ContractModel
  | TokenModel
  | WhitelistModel
  | MetadataModel
  | WalletModel
  | TransactionModel;

export type Range = {
  value: number;
  inclusive: boolean;
}[];