const reactObservable = require('../utils/reaction-observer.util'),
    { createQuote, getRandomQuote } = require('../db/funcs/quote.func'),
    { Observable } = require('rxjs'),
    { retry } = require('rxjs/operators'),
    moment = require('moment');

function delay(duration) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

async function authorString(quoteWithIncludes) {
    let authorString = quoteWithIncludes.nonUser;
    if (!quoteWithIncludes.nonUser) {
        const { alias, snowflake } = quoteWithIncludes.source;
        const source = await client.fetchUser(snowflake);
        authorString = alias ? `${ alias } (${ source })` : source;
    }

    return authorString;
}

module.exports = function(client, emojiName, duration, votesRequired, quoteDataFn) {

    async function fetchAuthor(message) {
        return await client.fetchUser(message.author.id);
    }

    async function submitQuote(message) {
        const channel = message.channel;
        const { content } = quoteDataFn(message);

        // just a placeholder message to indicate that the server has acknowledged
        let response = await channel.send('🤔');
        let quote = null;

        try {
            quote = await createQuote(message.author.id, 'Jolo Morales', false, moment().add(duration, 'days').toDate(), content, 2019);
        } catch (err) {
            console.log(err);
            // we send feedback if the fetching failed
            await response.edit(`${ message.author }, a database error occured while processing your quote!`);
            return;
        }

        await message.delete();

        response = await response.edit([
            `👂 **"${ quote.content }"** - ${ await authorString(quote) }, ${ quote.year }`,
            `*Submitted by ${ message.author }. Needs ${ votesRequired } ${ emojiName } reacts for approval. Expires at ${ moment(quote.expiresAt).format('MMM D (ddd), h:mm a') }.*`,
            `🆔 ${ quote.uuid }`
        ].join('\n'));

        const sub = reactObservable(response, emojiName, quote.expiresAt, votesRequired, [client.user.id])
            .subscribe(
                // on reaction collect
                res => {
                    // do nothing
                },
                // on error
                async err => {
                    await response.delete();
                    await channel.send([
                        `🗑️ **"${ quote.content }"** - ${ await authorString(quote) }, ${ quote.year }`,
                        `${ await fetchAuthor(message) }, your submission was not accepted due to lack of votes.`
                    ].join('\n'));
                },
                // on complete/approval
                async () => {
                    // await quote.update({
                    //     approvedAt: new Date()
                    // });

                    try {
                        // if updating the quote failes, try 5 more times
                        await new Observable(async observer => {
                            await quote.update({
                                approvedAt: new Date()
                            });
                            observer.next();
                            observer.complete();
                        }).pipe(retry(5)).toPromise();
                    } catch (err) {
                        await response.delete();
                        await channel.send([
                            `❌ **"${ quote.content }"** - ${ await authorString(quote) }, ${ quote.year }`,
                            `${ await fetchAuthor(message) }, an error occured while approving your quote.`
                        ].join('\n'));
                        return;
                    }

                    await response.delete();
                    await channel.send([
                        `💾 **"${ quote.content }"** - ${ await authorString(quote) }, ${ quote.year }`,
                        `${ await fetchAuthor(message) }, your submission has been accepted.`
                    ].join('\n'));
                }
            );
    }

    async function receiveQuote(message) {
        let reply = await message.channel.send('🤔');
        try {
            const quote = await getRandomQuote(message.author.id);

            if (!quote) {
                await reply.edit(`❌ **The quote bank is empty.**`);
                return;
            }

            for (let i = 0; i < 5; i++) {
                reply = await reply.edit(['🌬️', ...new Array(i).fill('      '), '💨'].join(''));
                await delay(100);
            }

            reply = await reply.edit(new Array(5).fill('🌫️').join(''));
            await delay(100);

            await reply.edit(`💭 **"${ quote.content }"** - ${ await authorString(quote) }, ${ quote.year }`);
        } catch (err) {
            console.log(err);
            await reply.edit('😵 A server side error occured!');
        }
    }

    return { submitQuote, receiveQuote }
}