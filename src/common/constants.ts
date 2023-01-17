export const WEB3_QUEUE = 'web3';
export const CRON_QUEUE = 'cron';
export const TX_WORKER = 'tx';

/**
 * An enum representing the types of metadata.
 *
 * @enum {string}
 */
export enum MetadataTypes {
  COMMON = 'common',
  SPECIFIED = 'specified',
}

/**
 * An enum representing the possible statuses for objects.
 *
 * @enum {string}
 */
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
}

/**
 * An enum representing the types of processes.
 *
 * @enum {string}
 */
export enum ProcessTypes {
  DEPLOY = 'deploy',
  COMMON = 'common',
  WHITELIST = 'whitelist',
}

/**
 * An enum representing the types of operations.
 *
 * @enum {string}
 */
export enum OperationTypes {
  MINT = 'mint',
  DEPLOY = 'deploy',
  COMMON = 'common',
  WHITELIST_ADD = 'whitelistadd',
  WHITELIST_REMOVE = 'whitelistremove',
  READ_CONTRACT = 'readcontract',
}

/**
 * An enum representing the types of objects.
 *
 * @enum {string}
 */
export enum ObjectTypes {
  CONTRACT = 'contract',
  TOKEN = 'token',
  WHITELIST = 'whitelist',
  METADATA = 'metadata',
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
}

/**
 * An enum representing the networks.
 *
 * @enum {number}
 */
export enum Networks {
  ETHEREUM = 5,
  POLYGON = 80001,
}

/**
 * An enum representing the types of files.
 *
 * @enum {string}
 */
export enum FileTypes {
  IMAGE = 'image',
  OBJECT = 'object',
}

/**
 * An enum representing the commands.
 *
 * @enum {string}
 */
export enum CMD {
  DEPLOY = 'deploycontract',
  CALL = 'processcall',
  ALL_OBJECTS = 'getallobjects',
  ONE_OBJECT = 'getoneobject',
  JOB = 'getjobbyid',
  UPDATE_METADATA = 'updatemetadata',
  UPDATE_STATUS = 'updatestatus',
  GET_MERKLE_PROOF = 'getmerkleproof',
  CREATE_WALLET = 'createwallet',
}
