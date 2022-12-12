export declare const WEB3_SERVICE = "WEB3_SERVICE";
export declare const REDIS_HOST = "localhost";
export declare const REDIS_PORT = 6379;
export declare enum PROCESSES {
    DEPLOY = "deploy",
    COMMON = "common",
    WHITELIST = "whitelist"
}
export declare enum OPERATIONS {
    MINT = "mint",
    DEPLOY = "deploy",
    COMMON = "common",
    WHITELIST_ADD = "whitelistadd",
    WHITELIST_REMOVE = "whitelistremove"
}
export declare enum OBJECTS {
    CONTRACT = "contract",
    TOKEN = "token",
    WHITELIST = "whitelist"
}
export declare enum NETWORKS {
    ETHEREUM = 5,
    POLYGON = 80001
}
export declare enum FILETYPES {
    IMAGE = "image",
    OBJECT = "object"
}
export declare enum CMD {
    DEPLOY = "deploycontract",
    CALL = "processcall",
    ALL_OBJECTS = "getallobjects",
    ONE_OBJECT = "getoneobject",
    JOB = "getjobbyid",
    UPDATE_METADATA = "updatemetadata"
}
export declare enum ROUTES {
    ONE = "one",
    ALL = "all",
    JOB = "job",
    PROCESS = "process",
    METADATA = "metadata/:id"
}
