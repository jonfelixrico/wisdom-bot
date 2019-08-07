const reactionObsUtil = require('../utils/reaction-listener.util'),
    { createQuote, getRandomQuote } = require('../db/funcs/quote.func');

function delay(duration) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

module.exports = function(client) {
    const createReactObs = reactionObsUtil(client);

    async function submitQuote(message, emojiName, approvalWindow, minimumVotesRequired, quoteDataFn) {
        const channel = message.channel;
        const quote = quoteDataFn(message);

        const response = await channel.send(
            `👂 **"${ quote.content }"** - ${ quote.author }, ${ quote.year }
            *Submitted by ${ message.author }. Needs ${ minimumVotesRequired } ${ emojiName } reacts for approval.*`
        );
        await response.react('💨');

        createReactObs(response, emojiName, approvalWindow, minimumVotesRequired, [client.user.id, message.author.id]).subscribe(async res => {
            await response.delete();
            if (!res) {
                await channel.send(
                    `🗑️ **"${ quote.content }"** - ${ quote.author }, ${ quote.year }
                    ${ message.author }, your submission was not accepted due to lack of votes.`
                );
                return;
            }

            await createQuote(message.author.id, message.id, quote.content, quote.author, quote.year);
        
            await channel.send(
                `💾 **"${ quote.content }"** - ${ quote.author }, ${ quote.year }
                ${ message.author }, your submission has been accepted.`
            );
        });
    }

    async function receiveQuote(channel) {
        const quote = await getRandomQuote();

        if (!quote) {
            channel.send(`❌ **The quote bank is empty.**`);
            return;
        }

        let fshwoop = await channel.send('💨');

        for (let i = 2; i <= 5; i++) {
            fshwoop = await fshwoop.edit(new Array(i).fill('💨').join(''));
            await delay(100);
        }

        await fshwoop.edit(
            `💭 **"${ quote.content }"** -${ quote.author }, ${ quote.year }`
        );
    }

    return { submitQuote, receiveQuote }
}