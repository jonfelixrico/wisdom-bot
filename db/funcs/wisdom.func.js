const models = require('../models'),
    uuid = require('short-uuid'),
    Author = models.Author,
    Quote = models.Quote;

async function create(discordId, content) {
    const author = await Author.findOrCreate({ where: { discordId: discordId } });
    return await Quote.create({ content, uuid: uuid.generate() });
}

async function remove(discordId, quoteUuid) {

}