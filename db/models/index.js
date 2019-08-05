const Author = require('./author.model'),
    Quote = require('./quote.model');

Author.hasMany(Quote, 'Wisdom');
Quote.belongsTo(Author);

module.exports = { Author, Quote };