"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const constants_1 = require("../common/constants");
const transaction_1 = __importDefault(require("./models/transaction"));
const contract_1 = __importDefault(require("./models/contract"));
const ethereum = new web3_1.default(new web3_1.default.providers.HttpProvider(process.env.ETHEREUM_HOST));
const polygon = new web3_1.default(new web3_1.default.providers.HttpProvider(process.env.POLYGON_HOST));
async function txWorker(job, doneCallback) {
    try {
        const transactions = await transaction_1.default.findAll({ where: { status: constants_1.Statuses.PENDING } });
        for (const tx of transactions) {
            const txHash = tx.tx_hash;
            if (!txHash)
                continue;
            const w3 = tx.network === constants_1.Networks.ETHEREUM ? ethereum : polygon;
            const txReciept = await w3.eth.getTransactionReceipt(txHash);
            if (!txReciept) {
                continue;
            }
            else if (txReciept.status) {
                const contract = await contract_1.default.findOne({ where: { id: tx.contract } });
                if (contract) {
                    contract.address = txReciept.contractAddress;
                    await contract.save();
                }
                tx.status = constants_1.Statuses.PROCESSED;
                tx.tx_receipt = txReciept;
                await tx.save();
                continue;
            }
            else if (!txReciept.status) {
                tx.status = constants_1.Statuses.FAILED;
                tx.tx_receipt = txReciept;
                await tx.save();
                continue;
            }
        }
        doneCallback(null, true);
    }
    catch (error) {
        console.log('[WORKER] tx:' + error.message, JSON.stringify(error));
        doneCallback(error, null);
    }
}
exports.default = txWorker;
//# sourceMappingURL=tx.worker.js.map