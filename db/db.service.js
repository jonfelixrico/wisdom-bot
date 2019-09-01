const Sequelize = require('sequelize'),
    mysql = require('mysql2');


const { DB_USER, DB_PASS, DB_HOST, DB_SCHEMA } = process.env;

const sequelize = new Sequelize(`mysql://${ DB_USER }:${ DB_PASS }@${ DB_HOST }/${ DB_SCHEMA }`, {
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
});

const mysqlPool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    database: DB_SCHEMA,
    password: DB_PASS,

    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0
}).promise();

async function execute(sql, params) {
    return (await mysqlPool.execute(sql, params))[0];
}

module.exports = { sequelize, execute };