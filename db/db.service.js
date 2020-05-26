const Sequelize = require('sequelize'),
  mysql = require('mysql2'),
  moment = require('moment-timezone')

const { DB_USER, DB_PASS, DB_HOST, DB_SCHEMA } = process.env

const sequelize = new Sequelize(
  `mysql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_SCHEMA}`,
  {
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
)

const mysqlPool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  database: DB_SCHEMA,
  password: DB_PASS,

  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
})

const mysqlPromisePool = mysqlPool.promise()

async function execute(sql, params) {
  return (await mysqlPromisePool.execute(sql, params))[0]
}

function ping() {
  let start = moment()
  return new Promise((res, rej) => {
    mysqlPool.getConnection(function (err, conn) {
      if (err) return rej(err)

      conn.ping(function (err) {
        if (err) return rej(err)
        mysqlPool.releaseConnection(conn)

        res(moment().diff(start, 'seconds', true))
      })
    })
  })
}

module.exports = { sequelize, execute, ping }
