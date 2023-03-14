'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tokens', 'token_ids', { type: Sequelize.ARRAY(Sequelize.INTEGER) });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tokens', 'token_ids');
  }
};
