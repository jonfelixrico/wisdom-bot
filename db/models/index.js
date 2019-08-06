const Sequelize = require('sequelize'),
    Op = Sequelize.Op;

// const sequelize = new Sequelize('quote_bot_db', 'quote-bot', 'fshwoop', {
//   host: 'hobby-mysql.cj4go5v0wkzo.ap-southeast-1.rds.amazonaws.com',
//   dialect: 'mysql',
//   pool: {
//     max: 10,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// });

const sequelize = new Sequelize('mysql://quote-bot:fshwoop@hobby-mysql.cj4go5v0wkzo.ap-southeast-1.rds.amazonaws.com:3306/quote_bot_db', {
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

// mysql://quote_bot:fshwoop@hobby-mysql.cj4go5v0wkzo.ap-southeast-1.rds.amazonaws.com:3306/quote_bot_db

// postgres://fred:xj78?23@example.com/db
const User = require('./user.model')(sequelize),
    Quote = require('./quote.model')(sequelize),
    MuteFlag = require('./mute-flag.model')(sequelize);

User.hasMany(Quote, { as: 'quotes', foreignKey: 'userId' });
Quote.belongsTo(User, { as: 'author', foreignKey: 'userId' });

User.hasMany(MuteFlag, { as: 'muteFlags', foreignKey: 'mutedUserId' });
MuteFlag.belongsTo(User, { as: 'mutedUser', foreignKey: 'mutedUserId' });

User.hasMany(MuteFlag, { as: 'issuedMutes', foreignKey: 'issuerId' });
MuteFlag.belongsTo(User, { as: 'issuer', foreignKey: 'issuerId' });

User.prototype.getActiveMuteFlag = async function() {
    const flags = await this.getMuteFlags({ 
        where: { 
            [Op.or]: [
                {
                    expiration: { [Op.eq]: null }
                },
                {
                    expiration: { [Op.gte]: new Date() }
                }
            ]
        }
    });

    return flags.length ? flags[0] : null;
}

module.exports = { User, Quote, MuteFlag, sequelize };