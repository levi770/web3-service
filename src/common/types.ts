import { ContractDto } from '../modules/db/dto/contract.dto';
import { MetadataDto } from '../modules/db/dto/metadata.dto';
import { TokenDto } from '../modules/db/dto/token.dto';
import { TransactionDto } from '../modules/db/dto/transaction.dto';
import { WalletDto } from '../modules/db/dto/wallet.dto';
import { ContractModel } from '../modules/db/models/contract.model';
import { MetadataModel } from '../modules/db/models/metadata.model';
import { TokenModel } from '../modules/db/models/token.model';
import { TransactionModel } from '../modules/db/models/transaction.model';
import { WalletModel } from '../modules/db/models/wallet.model';
import { WhitelistModel } from '../modules/db/models/whitelist.model';
import { CallDataDto } from '../modules/web3/dto/callData.dto';
import { CreateWalletDto } from '../modules/web3/dto/createWallet.dto';
import { DeployDataDto } from '../modules/web3/dto/deployData.dto';
import { MintDataDto } from '../modules/web3/dto/mintData.dto';
import { WhitelistDto } from '../modules/web3/dto/whitelist.dto';
import { EncryptedKeystoreV3Json } from 'web3-core';

export type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | WalletDto | string | null;
export type Wallet = { address: string; keystore: EncryptedKeystoreV3Json };
export type ProcessData = CreateWalletDto | CallDataDto | DeployDataDto | WhitelistDto;

export type CreateObjects =
  | ContractDto[]
  | TokenDto[]
  | WhitelistDto[]
  | MetadataDto[]
  | WalletDto[]
  | TransactionDto[];

export type CreatedObjects =
  | ContractModel[]
  | TokenModel[]
  | WhitelistModel[]
  | MetadataModel[]
  | WalletModel[]
  | TransactionModel[];

export type FindModelResult =
  | ContractModel
  | TokenModel
  | WhitelistModel
  | MetadataModel
  | WalletModel
  | TransactionModel;
