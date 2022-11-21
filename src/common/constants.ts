export enum ProcessTypes {
  MINT = 'mint',
  DEPLOY = 'deploy',
}

export enum ObjectTypes {
  CONTRACT = 'contract',
  TOKEN = 'token',
}

export enum Networks {
  ETHEREUM = 5,
  POLYGON = 80001,
}

export enum FileTypes {
  IMAGE = 'image',
  OBJECT = 'object',
}

export enum CMD {
  DEPLOY = 'deployContract',
  MINT = 'mintToken',
  ALL_CONTRACTS = 'getAllContracts',
  ONE_CONTRACT = 'getOneContract',
  ALL_TOKENS = 'getAllTokens',
  ONE_TOKEN = 'getOneToken',
  JOB = 'getJobById',
  UPDATE_METADATA = 'updateMetadata'
}

export const IPFS_MODULE_OPTIONS = 'IPFS_MODULE_OPTIONS';
export const WEB3_QUEUE = 'web3';