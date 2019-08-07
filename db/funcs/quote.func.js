const models = require('../models'),
    UserFuncs = require('./user.func'),
    User = models.User,
    Quote = models.Quote,
    sequelize = models.sequelize;

/*
    CREATE & DELETE FUNCTIONS
*/

// Creates a quote. Tested.
async function createQuote(authorId, messageId, content, author, year) {

    // finds the user associated with the authorId
    // if no records are found, registers the authorId and then creates it
    let user = await User.findOrCreate({ where: { discordUserId: authorId } });
    user = user[0]; // the func returns an array so we need to pluck its only result

    // check if the plucked user is currently muted; throws an error if they are
    if (await user.getActiveMuteFlag()) {
        throw new Error(`User is currently muted.`);
    }

    // create the quote and return it
    return await user.createQuote({
        discordMessageId: messageId,
        content,
        author,
        year
    });
}

// deletes a quote from the database
async function deleteQuote(adminId, discordMessageId) {
    // verify if the id associated with parameter adminId is really an admin
    await UserFuncs.findAdmin(adminId);

    // finds the quote associated with the given uuid
    const quote = await Quote.findOne({ where: { discordMessageId } });

    // return null if no quotes match
    if (!quote) {
        return null;
    }

    // destroy the quote from the db and return the leftovers
    return await quote.destroy();
}

/*
    QUOTE-FETCHING FUNCTIONS
*/

// Randomly grabs a quote from the database.
async function getRandomQuote() {
    const quote = await Quote.findOne({ order: sequelize.literal('rand()') });
    return quote || { content: 'The quote bank is empty.' };
}

/*
    ORPHAN RECOVERY
*/

async function checkIfOrphan(discordMessageId) {
    const quote = await Quote.findOne({ 
        where: { discordMessageId },
        attributes: ['discordMessageId']
    });

    return !!quote;
}

async function checkIfOrphanMulti(...discordMessageIds) {
    const quotes = await Quote.findAll({ 
        where: { discordMessageId },
        attributes: ['discordMessageId']
    });

    const acceptedIds = new Set(quotes.map(quote => quote.discordMessageId));

    const orhpanedIds = [];

    for (const id of discordMessageIds) {
        if (!acceptedIds.has(id)) {
            orhpanedIds.push(id);
        }
    }

    return orhpanedIds;
}

module.exports = { createQuote, deleteQuote, getRandomQuote, checkIfOrphan, checkIfOrphanMulti };