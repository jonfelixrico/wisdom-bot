const models = require('../models'),
    User = models.User,
    Quote = models.Quote;


// if the author doesnt exist, creates the author; then creates a quote
async function createQuote(authorId, content) {
    const author = await User.findOrCreate({ where: { discordId: authorId } });
    return await Quote.create({ content, Author: author });
}

// deletes a quote from the database
async function deleteQuote(adminId, quoteUuid) {
    const user = await getUser(adminId);

    if (!user.adminLevel) {
        return null;
    }

    const quote = await Quote.findOne({ where: { quoteUuid } });

    if (!quote) {
        return null;
    }

    quote.destroy();
    return quote;
}


async function approveQuote(approverId, quoteUuid) {

}

async function forceApproveQuote(adminId, quoteUuid) {

}

async function getRandomQuote() {

}