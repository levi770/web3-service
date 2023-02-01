export const WEB3_QUEUE = 'web3';
export const CRON_QUEUE = 'cron';
export const TX_WORKER = 'tx';
export const WEB3_CONTROLLER = 'Web3Controller';
export const DB_CONTROLLER = 'DbController';
export const SQS_CONTROLLER = 'SqsController';
export const WEB3_SERVICE = 'Web3Service';
export const SQS_CONSUMER_NAME = 'Web3Service.fifo';
export const SQS_PRODUCER_NAME = 'Web3Service2.fifo';

export enum ExceptionTypes {
  RPC = 'rpc',
  HTTP = 'http',
}

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
  PENDING = 'pending',
  SUCCESS = 'success',
}

export enum CMD {
  DEPLOY = 'deploycontract',
  MINT = 'minttoken',
  WHITELIST = 'whitelist',
  COMMON = 'commoncall',
  ALL_OBJECTS = 'getallobjects',
  ONE_OBJECT = 'getoneobject',
  JOB = 'getjobbyid',
  UPDATE_METADATA = 'updatemetadata',
  UPDATE_STATUS = 'updatestatus',
  GET_MERKLE_PROOF = 'getmerkleproof',
  CREATE_WALLET = 'createwallet',
  GET_METADATA = 'getmetadata',
  PREDICT_ADDRESS = 'predictaddress',
  GET_ADMIN = 'getadmin',
  SEND_ADMIN = 'sendadmin',
}

export enum ProcessTypes {
  CREATE_WALLET = 'createwallet',
  DEPLOY = 'deploy',
  MINT = 'mint',
  COMMON = 'common',
  WHITELIST = 'whitelist',
  MERKLE_PROOF = 'merkleproof',
}

export enum OperationTypes {
  MINT = 'mint',
  DEPLOY = 'deploy',
  COMMON = 'common',
  WHITELIST_ADD = 'whitelistadd',
  WHITELIST_REMOVE = 'whitelistremove',
  READ_CONTRACT = 'readcontract',
}

export enum ObjectTypes {
  CONTRACT = 'contract',
  TOKEN = 'token',
  WHITELIST = 'whitelist',
  METADATA = 'metadata',
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
}

export enum Networks {
  ETHEREUM = 5,
  POLYGON = 80001,
  LOCAL = 1337,
}

export enum FileTypes {
  IMAGE = 'image',
  OBJECT = 'object',
}
