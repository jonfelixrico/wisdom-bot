const User = require('./user.model'),
    Quote = require('./quote.model');

User.hasMany(Quote, 'Wisdom');
Quote.belongsTo(User);

module.exports = { User, Quote };