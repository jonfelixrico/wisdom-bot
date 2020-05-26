const { User, Quote, Receive, sequelize } = require('../models'),
  { execute } = require('../db.service'),
  { Op, Sequelize } = require('sequelize'),
  uuid = require('short-uuid').generate,
  _ = require('lodash'),
  weightedRandom = require('weighted-random')

/*
    CREATE & DELETE FUNCTIONS
*/

let receiveCount = 0

async function createQuote(
  submittedBy,
  spokenBy,
  isUser,
  expiresAt,
  content,
  year
) {
  year = year || new Date().getFullYear()

  let quote = null
  await sequelize.transaction(async (transaction) => {
    submittedBy = (
      await User.findOrCreate({
        where: { snowflake: submittedBy },
        transaction,
      })
    )[0]

    const data = {
      submittedBy: submittedBy.id,
      expiresAt,
      year,
      content,
      uuid: uuid(),
    }

    if (isUser) {
      spokenBy = (
        await User.findOrCreate({ where: { snowflake: spokenBy }, transaction })
      )[0]
      data.spokenBy = spokenBy.id
    } else {
      data.nonUser = spokenBy
    }

    quote = await Quote.create(data, { transaction })
  })

  return quote
}

async function approveQuote(quoteUuid) {
  const quote = Quote.findOne({
    where: {
      uuid: quoteUuid,
      approvedAt: null,
      expiresAt: { [Op.gte]: new Date() },
    },
  })

  if (!quote) {
    throw new Error(
      `${quoteUuid} does not point to an existing or active unapproved quote.`
    )
  }

  return await quote.update({ approvedAt: new Date() })
}

/*
    QUOTE-FETCHING FUNCTIONS
*/

// use weightedRandom to pick the quote
function randomizeWeighted(quotes) {
  const receiveLengths = quotes.map((q) => q.receives.length)
  const max = _.max(receiveLengths)
  const BIAS = 1

  // the lesser the number of receives a quote has, the higher chance it has to be picked
  const randomizedIdx = weightedRandom(
    receiveLengths.map((rl) => max - rl + BIAS)
  )

  return quotes[randomizedIdx].id
}

// use lodash shuffle to pick the quote
function randomizePure(quotes) {
  return _.chain(quotes).shuffle().head().value().id
}

// get the head of the quotes array, and that will be the quote
function randomizeDb(quotes) {
  return _.head(quotes).id
}

const RANDOMIZERS = [randomizeDb, randomizePure, randomizeWeighted]

// Randomly grabs a quote from the database.
async function getRandomQuote(userSnowflake) {
  let quotes = await Quote.findAll({
    where: {
      approvedAt: {
        [Op.ne]: null,
      },
    },
    include: [{ model: Receive, as: 'receives' }],
    order: Sequelize.fn('rand'),
    limit: 20,
  })

  const randomizerIdx = _.random(0, RANDOMIZERS.length - 1, false)
  console.debug(`Randomizer index is ${randomizerIdx}`)
  const randomizer = RANDOMIZERS[randomizerIdx]

  const selectedId = randomizer(quotes)
  console.debug(`Quote to be received has id ${selectedId}`)

  await sequelize.transaction(async (transaction) => {
    quote = await Quote.findByPk(selectedId, { transaction })
    const user = (
      await User.findOrCreate({
        where: { snowflake: userSnowflake },
        transaction,
      })
    )[0]

    await Receive.create(
      { quoteId: quote.id, receivedBy: user.id, receivedAt: new Date() },
      { transaction }
    )
  })

  receiveCount++

  return quote
}

async function getUnapproved() {
  return await Quote.findAll({
    // we remove the filter for expiredAt for now
    where: { approvedAt: null },
    include: ['submitter', 'source'],
  })
}

async function getStatistics() {
  const data = await execute(`
        SELECT
	        SUM(IF(approvedAt is not null, 1, 0)) approved,
            SUM(IF(approvedAt is null and expiresAt >= CURRENT_TIMESTAMP, 1, 0)) pending,
            SUM(IF(approvedAt is null and expiresAt < CURRENT_TIMESTAMP, 1, 0)) expired,
            MAX(submittedAt) last_submit
        FROM quotes;
    `)

  return data[0]
}

function getReceiveCount() {
  return receiveCount
}

module.exports = {
  createQuote,
  approveQuote,
  getRandomQuote,
  getUnapproved,
  getStatistics,
  getReceiveCount,
}
