const Sequelize = require('sequelize'),
    Op = Sequelize.Op;

const sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, {
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

const User = require('./user.model')(sequelize),
    Quote = require('./quote.model')(sequelize),
    MuteFlag = require('./mute-flag.model')(sequelize);

User.hasMany(Quote, { as: 'quotes', foreignKey: 'userId' });
Quote.belongsTo(User, { as: 'user', foreignKey: 'userId' });

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