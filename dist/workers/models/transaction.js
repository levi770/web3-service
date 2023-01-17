"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_instance_1 = require("./db_instance");
const sequelize_1 = require("sequelize");
const config = {
    tableName: 'transactions',
    sequelize: db_instance_1.sequelize,
};
class Transaction extends sequelize_1.Model {
}
Transaction.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    network: {
        type: sequelize_1.DataTypes.INTEGER,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
    },
    tx_payload: {
        type: sequelize_1.DataTypes.JSON,
    },
    tx_hash: {
        type: sequelize_1.DataTypes.STRING,
    },
    tx_receipt: {
        type: sequelize_1.DataTypes.JSON,
    },
    error: {
        type: sequelize_1.DataTypes.JSON,
    },
}, config);
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map