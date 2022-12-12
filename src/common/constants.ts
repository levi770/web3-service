export enum MetadataTypes {
  COMMON = 'common',
  SPECIFIED = 'specified',
}

export enum Statuses {
  CREATED = 'created',
  PROCESSED = 'processed',
  UNKNOWN = 'unknown',
  FAILED = 'failed',
  DEPLOYED = 'deployed',
  MINTED = 'minted',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

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
  METADATA = 'metadata',
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
  JOB = 'getjobbyid',
  UPDATE_METADATA = 'updatemetadata',
  UPDATE_STATUS = 'updatestatus',
}

export const WEB3_QUEUE = 'web3';
