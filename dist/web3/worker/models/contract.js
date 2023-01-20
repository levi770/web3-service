"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_instance_1 = require("./db_instance");
const sequelize_1 = require("sequelize");
const config = {
    tableName: 'contracts',
    sequelize: db_instance_1.sequelize,
};
class Contract extends sequelize_1.Model {
}
Contract.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
    },
}, config);
exports.default = Contract;
//# sourceMappingURL=contract.js.map