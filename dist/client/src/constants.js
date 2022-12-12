"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTES = exports.CMD = exports.FILETYPES = exports.NETWORKS = exports.OBJECTS = exports.OPERATIONS = exports.PROCESSES = exports.REDIS_PORT = exports.REDIS_HOST = exports.WEB3_SERVICE = void 0;
exports.WEB3_SERVICE = 'WEB3_SERVICE';
exports.REDIS_HOST = 'localhost';
exports.REDIS_PORT = 6379;
var PROCESSES;
(function (PROCESSES) {
    PROCESSES["DEPLOY"] = "deploy";
    PROCESSES["COMMON"] = "common";
    PROCESSES["WHITELIST"] = "whitelist";
})(PROCESSES = exports.PROCESSES || (exports.PROCESSES = {}));
var OPERATIONS;
(function (OPERATIONS) {
    OPERATIONS["MINT"] = "mint";
    OPERATIONS["DEPLOY"] = "deploy";
    OPERATIONS["COMMON"] = "common";
    OPERATIONS["WHITELIST_ADD"] = "whitelistadd";
    OPERATIONS["WHITELIST_REMOVE"] = "whitelistremove";
})(OPERATIONS = exports.OPERATIONS || (exports.OPERATIONS = {}));
var OBJECTS;
(function (OBJECTS) {
    OBJECTS["CONTRACT"] = "contract";
    OBJECTS["TOKEN"] = "token";
    OBJECTS["WHITELIST"] = "whitelist";
})(OBJECTS = exports.OBJECTS || (exports.OBJECTS = {}));
var NETWORKS;
(function (NETWORKS) {
    NETWORKS[NETWORKS["ETHEREUM"] = 5] = "ETHEREUM";
    NETWORKS[NETWORKS["POLYGON"] = 80001] = "POLYGON";
})(NETWORKS = exports.NETWORKS || (exports.NETWORKS = {}));
var FILETYPES;
(function (FILETYPES) {
    FILETYPES["IMAGE"] = "image";
    FILETYPES["OBJECT"] = "object";
})(FILETYPES = exports.FILETYPES || (exports.FILETYPES = {}));
var CMD;
(function (CMD) {
    CMD["DEPLOY"] = "deploycontract";
    CMD["CALL"] = "processcall";
    CMD["ALL_OBJECTS"] = "getallobjects";
    CMD["ONE_OBJECT"] = "getoneobject";
    CMD["JOB"] = "getjobbyid";
    CMD["UPDATE_METADATA"] = "updatemetadata";
})(CMD = exports.CMD || (exports.CMD = {}));
var ROUTES;
(function (ROUTES) {
    ROUTES["ONE"] = "one";
    ROUTES["ALL"] = "all";
    ROUTES["JOB"] = "job";
    ROUTES["PROCESS"] = "process";
    ROUTES["METADATA"] = "metadata/:id";
})(ROUTES = exports.ROUTES || (exports.ROUTES = {}));
//# sourceMappingURL=constants.js.map