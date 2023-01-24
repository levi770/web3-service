export declare const WEB3_QUEUE = "web3";
export declare const CRON_QUEUE = "cron";
export declare const TX_WORKER = "tx";
export declare const WEB3_CONTROLLER = "Web3Controller";
export declare const DB_CONTROLLER = "DbController";
export declare enum MetadataTypes {
    COMMON = "common",
    SPECIFIED = "specified"
}
export declare enum Statuses {
    CREATED = "created",
    PROCESSED = "processed",
    UNKNOWN = "unknown",
    FAILED = "failed",
    DEPLOYED = "deployed",
    MINTED = "minted",
    UPDATED = "updated",
    DELETED = "deleted",
    PENDING = "pending",
    SUCCESS = "success"
}
export declare enum CMD {
    DEPLOY = "deploycontract",
    MINT = "minttoken",
    WHITELIST = "whitelist",
    COMMON = "commoncall",
    ALL_OBJECTS = "getallobjects",
    ONE_OBJECT = "getoneobject",
    JOB = "getjobbyid",
    UPDATE_METADATA = "updatemetadata",
    UPDATE_STATUS = "updatestatus",
    GET_MERKLE_PROOF = "getmerkleproof",
    CREATE_WALLET = "createwallet",
    GET_METADATA = "getmetadata",
    PREDICT_ADDRESS = "predictaddress"
}
export declare enum ProcessTypes {
    CREATE_WALLET = "createwallet",
    DEPLOY = "deploy",
    MINT = "mint",
    COMMON = "common",
    WHITELIST = "whitelist",
    MERKLE_PROOF = "merkleproof"
}
export declare enum OperationTypes {
    MINT = "mint",
    DEPLOY = "deploy",
    COMMON = "common",
    WHITELIST_ADD = "whitelistadd",
    WHITELIST_REMOVE = "whitelistremove",
    READ_CONTRACT = "readcontract"
}
export declare enum ObjectTypes {
    CONTRACT = "contract",
    TOKEN = "token",
    WHITELIST = "whitelist",
    METADATA = "metadata",
    WALLET = "wallet",
    TRANSACTION = "transaction"
}
export declare enum Networks {
    ETHEREUM = 5,
    POLYGON = 80001,
    LOCAL = 1337
}
export declare enum FileTypes {
    IMAGE = "image",
    OBJECT = "object"
}
