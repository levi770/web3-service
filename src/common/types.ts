import { ContractDto } from '../db/dto/contract.dto';
import { MetadataDto } from '../db/dto/metadata.dto';
import { TokenDto } from '../db/dto/token.dto';
import { TransactionDto } from '../db/dto/transaction.dto';
import { WalletDto } from '../db/dto/wallet.dto';
import { ContractModel } from '../db/models/contract.model';
import { MetadataModel } from '../db/models/metadata.model';
import { TokenModel } from '../db/models/token.model';
import { TransactionModel } from '../db/models/transaction.model';
import { WalletModel } from '../db/models/wallet.model';
import { WhitelistModel } from '../db/models/whitelist.model';
import { DeployDataDto } from '../web3/dto/deployData.dto';
import { MintDataDto } from '../web3/dto/mintData.dto';
import { WhitelistDto } from '../web3/dto/whitelist.dto';
import { EncryptedKeystoreV3Json } from 'web3-core';

export type Data = DeployDataDto | MintDataDto | ContractModel | TokenModel | string | null;

export type Wallet = { address: string; keystore: EncryptedKeystoreV3Json };

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
