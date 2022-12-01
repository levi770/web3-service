export enum ProcessTypes {
  DEPLOY = 'deploy',
  COMMON = 'common',
  WHITELIST = 'whitelist',
}

export enum OperationTypes {
  MINT = 'mint',
  DEPLOY = 'deploy',
  COMMON = 'common',
  WHITELIST_ADD = 'whitelistadd',
  WHITELIST_REMOVE = 'whitelistremove',
}

export enum ObjectTypes {
  CONTRACT = 'contract',
  TOKEN = 'token',
  WHITELIST = 'whitelist',
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
  DEPLOY = 'deploycontract',
  CALL = 'processcall',
  ALL_OBJECTS = 'getallobjects',
  ONE_OBJECT = 'getoneobject',
  ALL_TOKENS = 'getalltokens',
  ONE_TOKEN = 'getonetoken',
  JOB = 'getjobbyid',
  UPDATE_METADATA = 'updatemetadata',
}

export const WEB3_QUEUE = 'web3';
