const Sequelize = require('sequelize'),
    { sequelize } = require('../db.service');

const User = require('./user.model')(sequelize),
    Quote = require('./quote.model')(sequelize),
    Receive = require('./receive.model')(sequelize);

User.hasMany(Quote, { as: 'submitted', foreignKey: 'submittedBy' });
User.hasMany(Quote, { as: 'quotes', foreignKey: 'spokenBy' });

Quote.belongsTo(User, { as: 'submitter', foreignKey: 'submittedBy' });
Quote.belongsTo(User, { as: 'source', foriegnKey: 'spokenBy' });

Quote.hasMany(Receive, { as: 'receives', foreignKey: 'quoteId' });
Receive.belongsTo(Quote, { as: 'quote', foreignKey: 'quoteId' });

User.hasMany(Receive, { as: 'received', foreignKey: 'receivedBy' });
Receive.belongsTo(User, { as: 'recipient', foreignKey: 'receivedBy' });

module.exports = { User, Quote, Receive, sequelize };