const { User, Quote, Receive, sequelize } = require('../models'),
    { execute } = require('../db.service'),
    { Op } = require('sequelize'),
    weightedRandom = require('weighted-random'),
    uuid = require('short-uuid').generate;

/*
    CREATE & DELETE FUNCTIONS
*/

async function createQuote(submittedBy, spokenBy, isUser, expiresAt, content, year) {
    year = year || new Date().getFullYear();

    let quote = null;
    await sequelize.transaction(async transaction => {
        submittedBy = (await User.findOrCreate({ where: { snowflake: submittedBy }, transaction }))[0];

        const data = {
            submittedBy: submittedBy.id,
            expiresAt,
            year,
            content,
            uuid: uuid()
        };

        if (isUser) {
            spokenBy = (await User.findOrCreate({ where: { snowflake: spokenBy }, transaction }))[0];
            data.spokenBy = spokenBy.id;
        } else {
            data.nonUser = spokenBy;
        }

        quote = await Quote.create(data, { transaction });
    });

    return quote;
}

async function approveQuote(quoteUuid) {
    const quote = Quote.findOne({ where: {
        uuid: quoteUuid,
        approvedAt: null,
        expiresAt: { [Op.gte]: new Date() }
    } });

    if (!quote) {
        throw new Error(`${ quoteUuid } does not point to an existing or active unapproved quote.`);
    }

    return await quote.update({ approvedAt: new Date() });
}

/*
    QUOTE-FETCHING FUNCTIONS
*/

// Randomly grabs a quote from the database.
async function getRandomQuote(userSnowflake) {
    let quotes = await execute(`
        SELECT
            q.id,
            IFNULL(r.count, 0) count
        FROM quotes q
        LEFT JOIN (
            SELECT
                COUNT(*) count,
                quoteId
            FROM receives
            GROUP BY quoteId
        ) r ON q.id = r.quoteId
        WHERE q.approvedAt IS NOT NULL
    `);

    if (!quotes.length) {
        return null;
    }

    const weights = quotes.map(quote => quote.count),
        max = Math.max(...weights);

    const selectedId = quotes[weightedRandom(weights.map(weight => Math.pow(max === 0 ? 100 : (101 - (weight / max * 100)), 1)))].id;

    let quote = null;

    await sequelize.transaction(async transaction => {
        quote = await Quote.findByPk(selectedId, { transaction });
        const user = (await User.findOrCreate({ where: { snowflake: userSnowflake }, transaction }))[0];

        await Receive.create({ quoteId: quote.id, receivedBy: user.id, receivedAt: new Date() }, { transaction });
    });

    return quote;
}

async function getUnapproved() {
    return await Quote.findAll({
        // we remove the filter for expiredAt for now
        where: { approvedAt: null },
        include: ['submitter', 'source']
    });
}

module.exports = { createQuote, approveQuote, getRandomQuote, getUnapproved };