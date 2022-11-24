"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB3_QUEUE = exports.IPFS_MODULE_OPTIONS = exports.CMD = exports.FileTypes = exports.Networks = exports.ObjectTypes = exports.ProcessTypes = void 0;
var ProcessTypes;
(function (ProcessTypes) {
    ProcessTypes["MINT"] = "mint";
    ProcessTypes["DEPLOY"] = "deploy";
})(ProcessTypes = exports.ProcessTypes || (exports.ProcessTypes = {}));
var ObjectTypes;
(function (ObjectTypes) {
    ObjectTypes["CONTRACT"] = "contract";
    ObjectTypes["TOKEN"] = "token";
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
    CMD["DEPLOY"] = "deployContract";
    CMD["MINT"] = "mintToken";
    CMD["ALL_CONTRACTS"] = "getAllContracts";
    CMD["ONE_CONTRACT"] = "getOneContract";
    CMD["ALL_TOKENS"] = "getAllTokens";
    CMD["ONE_TOKEN"] = "getOneToken";
    CMD["JOB"] = "getJobById";
    CMD["UPDATE_METADATA"] = "updateMetadata";
})(CMD = exports.CMD || (exports.CMD = {}));
exports.IPFS_MODULE_OPTIONS = 'IPFS_MODULE_OPTIONS';
exports.WEB3_QUEUE = 'web3';
//# sourceMappingURL=constants.js.map