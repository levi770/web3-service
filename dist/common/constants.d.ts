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
    DELETED = "deleted"
}
export declare enum ProcessTypes {
    DEPLOY = "deploy",
    COMMON = "common",
    WHITELIST = "whitelist"
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
    METADATA = "metadata"
}
export declare enum Networks {
    ETHEREUM = 5,
    POLYGON = 80001
}
export declare enum FileTypes {
    IMAGE = "image",
    OBJECT = "object"
}
export declare enum CMD {
    DEPLOY = "deploycontract",
    CALL = "processcall",
    ALL_OBJECTS = "getallobjects",
    ONE_OBJECT = "getoneobject",
    JOB = "getjobbyid",
    UPDATE_METADATA = "updatemetadata",
    UPDATE_STATUS = "updatestatus",
    GET_MERKLE_PROOF = "getmerkleproof"
}
export declare const WEB3_QUEUE = "web3";
