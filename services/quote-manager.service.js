const reactObservable = require('../utils/reaction-observer.util'),
  {
    createQuote,
    getRandomQuote,
    getUnapproved,
  } = require('../db/funcs/quote.func'),
  { Observable } = require('rxjs'),
  { retry } = require('rxjs/operators'),
  moment = require('moment-timezone')

function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

module.exports = function (
  client,
  emojiName,
  duration,
  votesRequired,
  quoteDataFn,
  channelName
) {
  async function fetchAuthor(message) {
    return await client.fetchUser(message.author.id)
  }

  async function fetchUser(snowflake) {
    return await client.fetchUser(snowflake)
  }

  async function authorString(quoteWithIncludes) {
    let authorString = quoteWithIncludes.nonUser
    if (!quoteWithIncludes.nonUser) {
      const { alias, snowflake } = quoteWithIncludes.source
      const source = await client.fetchUser(snowflake)
      authorString = alias ? `${alias} (${source})` : source
    }

    return authorString
  }

  async function submitQuote(message) {
    const channel = message.channel
    const { content } = quoteDataFn(message)

    // just a placeholder message to indicate that the server has acknowledged
    let response = await channel.send('🤔')
    let quote = null

    try {
      quote = await createQuote(
        message.author.id,
        'Jolo Morales',
        false,
        moment().add(duration, 'days').toDate(),
        content,
        2019
      )
    } catch (err) {
      console.log(err)
      // we send feedback if the fetching failed
      await response.edit(
        `${message.author}, a database error occured while processing your quote!`
      )
      return
    }

    await message.delete()

    response = await response.edit(
      [
        `👂 **"${quote.content}"** - ${await authorString(quote)}, ${
          quote.year
        }`,
        `*Submitted by ${
          message.author
        }. Needs ${votesRequired} ${emojiName} reacts for approval. Expires at ${moment(
          quote.expiresAt
        ).format('MMM D (ddd), h:mm a')}.*`,
        `🆔 ${quote.uuid}`,
      ].join('\n')
    )

    reactObservable(response, emojiName, quote.expiresAt, votesRequired, [
      client.user.id,
    ]).subscribe(
      // on reaction collect
      (res) => {
        // do nothing
      },
      // on error
      async (err) => {
        await response.delete()
        await channel.send(
          [
            `🗑️ **"${quote.content}"** - ${await authorString(quote)}, ${
              quote.year
            }`,
            `${await fetchAuthor(
              message
            )}, your submission was not accepted due to lack of votes.`,
          ].join('\n')
        )
      },
      // on complete/approval
      async () => {
        try {
          // if updating the quote failes, try 5 more times
          await new Observable(async (observer) => {
            await quote.update({
              approvedAt: new Date(),
            })
            observer.next()
            observer.complete()
          })
            .pipe(retry(5))
            .toPromise()
        } catch (err) {
          await response.delete()
          await channel.send(
            [
              `❌ **"${quote.content}"** - ${await authorString(quote)}, ${
                quote.year
              }`,
              `${await fetchAuthor(
                message
              )}, an error occured while approving your quote.`,
            ].join('\n')
          )
          return
        }

        await response.delete()
        await channel.send(
          [
            `💾 **"${quote.content}"** - ${await authorString(quote)}, ${
              quote.year
            }`,
            `${await fetchAuthor(message)}, your submission has been accepted.`,
          ].join('\n')
        )
      }
    )
  }

  async function receiveQuote(message) {
    let reply = await message.channel.send('🤔')
    try {
      const quote = await getRandomQuote(message.author.id)

      if (!quote) {
        await reply.edit(`❌ **The quote bank is empty.**`)
        return
      }

      for (let i = 0; i < 3; i++) {
        reply = await reply.edit(
          ['🌬️', ...new Array(i).fill('      '), '💨'].join('')
        )
        await delay(100)
      }

      await reply.edit(
        `💭 **"${quote.content}"** - ${await authorString(quote)}, ${moment(
          quote.submittedAt
        ).get('year')}`
      )
    } catch (err) {
      console.log(err)
      await reply.edit('😵 A server side error occured!')
    }
  }

  async function recoverOrphans() {
    const channel = client.channels
      .array()
      .filter(
        (channel) => channel.type === 'text' && channel.name === channelName
      )[0]
    // get unapproved quotes from the db
    let unapproved = await getUnapproved()
    // convert it from array to dict, with the uuid as the key
    unapproved = unapproved.reduce((obj, row) => {
      obj[row.uuid] = row
      return obj
    }, {})

    // fetch all messages from the given channel
    let messages = await channel.fetchMessages({ limit: 100 })
    // filter out the messages to the unapproved messages - starts with ear emoji and is sent by the bot
    messages = messages
      .array()
      .filter(
        (message) =>
          message.content.startsWith('👂') &&
          message.author.id === client.user.id
      )

    for (let message of messages) {
      const split = message.content.split('\n')
      const uuid = split[split.length - 1].replace('🆔 ', '').trim()

      const quote = unapproved[uuid]

      if (!quote) {
        await message.delete()
        continue
      }

      reactObservable(message, emojiName, quote.expiresAt, votesRequired, [
        client.user.id,
      ]).subscribe(
        // on reaction collect
        (res) => {
          // do nothing
        },
        // on error
        async (err) => {
          await message.delete()
          await channel.send(
            [
              `🗑️ **"${quote.content}"** - ${await authorString(quote)}, ${
                quote.year
              }`,
              `${await fetchUser(
                quote.submitter.snowflake
              )}, your submission was not accepted due to lack of votes.`,
            ].join('\n')
          )
        },
        // on complete/approval
        async () => {
          try {
            // if updating the quote failes, try 5 more times
            await new Observable(async (observer) => {
              await quote.update({
                approvedAt: new Date(),
              })
              observer.next()
              observer.complete()
            })
              .pipe(retry(5))
              .toPromise()
          } catch (err) {
            await message.delete()
            await channel.send(
              [
                `❌ **"${quote.content}"** - ${await authorString(quote)}, ${
                  quote.year
                }`,
                `${await fetchUser(
                  quote.submitter.snowflake
                )}, an error occured while approving your quote.`,
              ].join('\n')
            )
            return
          }

          await message.delete()
          await channel.send(
            [
              `💾 **"${quote.content}"** - ${await authorString(quote)}, ${
                quote.year
              }`,
              `${await fetchUser(
                quote.submitter.snowflake
              )}, your submission has been accepted.`,
            ].join('\n')
          )
        }
      )
    }

    console.log('Orphan recovery complete.')
  }

  return { submitQuote, receiveQuote, recoverOrphans }
}
