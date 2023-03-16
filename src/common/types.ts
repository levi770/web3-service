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
import { CallDto } from '../modules/web3/dto/requests/call.dto';
import { CreateWalletDto } from '../modules/web3/dto/requests/createWallet.dto';
import { DeployDto } from '../modules/web3/dto/requests/deploy.dto';
import { MintOptionsDto } from '../modules/web3/interfaces/mintOptions.dto';
import { WhitelistRequest } from '../modules/web3/dto/requests/whitelist.request';

export type Data = DeployDto | MintOptionsDto | ContractModel | TokenModel | IWallet | string | null;
export type ProcessData = CreateWalletDto | CallDto | DeployDto | WhitelistRequest;

export type CreateObjects = IContract[] | IToken[] | WhitelistRequest[] | IMetadata[] | IWallet[] | ITransaction[];

export type CreatedObjects = ContractModel[] | TokenModel[] | WhitelistModel[] | MetadataModel[] | WalletModel[] | TransactionModel[];

export type ModelResponse = ContractModel | TokenModel | WhitelistModel | MetadataModel | WalletModel | TransactionModel;

export type Range = {
  value: number;
  inclusive: boolean;
}[];
