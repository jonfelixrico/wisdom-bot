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
            `👂 **"${ quote.content }"** -${ quote.author }, ${ quote.year }
            *submitted by ${ message.author }*`
        );
        await response.react('💨');

        createReactObs(response, emojiName, approvalWindow, minimumVotesRequired, [client.user.id]).subscribe(async res => {
            await response.delete();
            if (!res) {
                await channel.send(
                    `🗑️ **"${ quote.content }"** -${ quote.author }, ${ quote.year }
                    ${ message.author }, your submission was not accepted due to lack of votes.`
                );
                return;
            }

            await createQuote(message.author.id, message.id, quote.content, quote.author, quote.year);
        
            await channel.send(
                `💾 **"${ quote.content }"** -${ quote.author }, ${ quote.year }
                ${ message.user }, your submission has been accepted.`
            );
        });
    }

    async function receiveQuote(channel) {
        const quote = await getRandomQuote();

        if (!quote) {
            channel.send(`❌ **The quote bank is empty.**`);
            return;
        }

        let loadingMessage = null;

        for (let i = 1; i <= 5; i++) {
            if (loadingMessage !== null) {
                await loadingMessage.delete();
            }

            loadingMessage = await channel.send(new Array(i).fill('💨').join(''));
            await delay(100);
        }

        await loadingMessage.delete();

        await channel.send(
            `💭 **"${ quote.content }"** -${ quote.author }, ${ quote.year }`
        );
    }

    return { submitQuote, receiveQuote }
}