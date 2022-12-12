"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB3_QUEUE = exports.CMD = exports.FileTypes = exports.Networks = exports.ObjectTypes = exports.OperationTypes = exports.ProcessTypes = exports.Statuses = void 0;
var Statuses;
(function (Statuses) {
    Statuses["CREATED"] = "created";
    Statuses["PROCESSED"] = "processed";
    Statuses["UNKNOWN"] = "unknown";
    Statuses["FAILED"] = "failed";
    Statuses["DEPLOYED"] = "deployed";
    Statuses["MINTED"] = "minted";
    Statuses["UPDATED"] = "updated";
    Statuses["DELETED"] = "deleted";
})(Statuses = exports.Statuses || (exports.Statuses = {}));
var ProcessTypes;
(function (ProcessTypes) {
    ProcessTypes["DEPLOY"] = "deploy";
    ProcessTypes["COMMON"] = "common";
    ProcessTypes["WHITELIST"] = "whitelist";
})(ProcessTypes = exports.ProcessTypes || (exports.ProcessTypes = {}));
var OperationTypes;
(function (OperationTypes) {
    OperationTypes["MINT"] = "mint";
    OperationTypes["DEPLOY"] = "deploy";
    OperationTypes["COMMON"] = "common";
    OperationTypes["WHITELIST_ADD"] = "whitelistadd";
    OperationTypes["WHITELIST_REMOVE"] = "whitelistremove";
})(OperationTypes = exports.OperationTypes || (exports.OperationTypes = {}));
var ObjectTypes;
(function (ObjectTypes) {
    ObjectTypes["CONTRACT"] = "contract";
    ObjectTypes["TOKEN"] = "token";
    ObjectTypes["WHITELIST"] = "whitelist";
    ObjectTypes["METADATA"] = "metadata";
})(ObjectTypes = exports.ObjectTypes || (exports.ObjectTypes = {}));
var Networks;
(function (Networks) {
    Networks[Networks["ETHEREUM"] = 5] = "ETHEREUM";
    Networks[Networks["POLYGON"] = 80001] = "POLYGON";
})(Networks = exports.Networks || (exports.Networks = {}));
var FileTypes;
(function (FileTypes) {
    FileTypes["IMAGE"] = "image";
    FileTypes["OBJECT"] = "object";
})(FileTypes = exports.FileTypes || (exports.FileTypes = {}));
var CMD;
(function (CMD) {
    CMD["DEPLOY"] = "deploycontract";
    CMD["CALL"] = "processcall";
    CMD["ALL_OBJECTS"] = "getallobjects";
    CMD["ONE_OBJECT"] = "getoneobject";
    CMD["JOB"] = "getjobbyid";
    CMD["UPDATE_METADATA"] = "updatemetadata";
    CMD["UPDATE_STATUS"] = "updatestatus";
})(CMD = exports.CMD || (exports.CMD = {}));
exports.WEB3_QUEUE = 'web3';
//# sourceMappingURL=constants.js.map