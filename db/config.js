require('dotenv').config();
module.exports = {
  development: {
    dialect: 'postgres',
    url: process.env.POSTGRES_URI,
  },
  test: {
    dialect: 'postgres',
    url: process.env.POSTGRES_URI,
  },
  production: {
    dialect: 'postgres',
    url: process.env.POSTGRES_URI,
  },
};
