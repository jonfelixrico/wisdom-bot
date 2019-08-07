const funcs = require('../db/funcs/quote.func'),
    { BehaviorSubject, timer, of, throwError, merge } = require('rxjs'),
    { filter, mergeMap, map, finalize, take, first } = require('rxjs/operators'),
    moment = require('moment');

module.exports = function(client) {

    const pending = {};

    
    function countReacts(message, emojiName) {
        // fetch the MessageReaction instance from the Message instance
        // with an emoji that matches the ID of the specified one in this func
        const reaction = message.reactions.array().filter(reacts => reacts.emoji.name === emojiName);

        // if the reaction is null, then we return 0 since it means there is no reaction for the message
        // that matches the specified emoji

        // else, we get the users from the MessageReaction and then we count the number of users that reacted.
        // we do NOT include the author of the message in the count, if ever they reacted in their own message
        return !reaction.length ? 0 : reaction[0].users.keyArray().filter(id => id !== message.author.id).length;
    }

    async function createReactionObservable(message, emojiName, days, threshold) {
        // get the message's text channel
        const textChannel = message.channel;

        const createdAt = moment(message.createdAt);
        const timerValue = createdAt.add(days, 'days').toDate();

        // create an subject with its initial value set to the number of
        // reacts in the message that matches the emoji
        const reactSubject = new BehaviorSubject(countReacts(message, emojiName));

        // create a message collector instance
        const collector = message.createReactionCollector(() => true);

        if (reactSubject.value >= threshold) {
            // if the message has already reached the threshold,
            // we return the message id which means success
            return of(message.id);
        } else if (timerValue < new Date()) {
            return throwError('This message is already past its expiration date.');
        }

        // listen for reaction adds
        collector.on('collect', async () => {
            // fetch the latest message instance (contains all reactions up to this point)
            const fetchedMessage = await textChannel.fetchMessage(message.id);
            // count the reactions and update
            reactSubject.next(countReacts(fetchedMessage, emojiName));
        });

        // create an observable that will complete/emit if the threshold is reached
        const thresholdReached$ = reactSubject.asObservable().pipe(
            filter(res => res === threshold),
            first()
        );

        const windowOver$ = timer(timerValue).pipe(
            map(() => {
                throw new Error('Window for approval is already over!');
            })
        );

        return merge(
            thresholdReached$.pipe(map(() => true)),
            windowOver$
        ).pipe(
            take(1),
            finalize(() => {
                // stop listening for reactions on completion
                collector.stop();
            })
        );
    }

    async function sweepMessagesForOrphans(channel, emojiName, days, threshold, quoteExtractionCallback) {
        // const messages = await channel.fetchMessages();
        // const orphanIds  = new Set(await funcs.checkIfOrphanMulti(messages.keyArray()));

        // const orphanedMessages = messages.array().filter(message => orphanIds.has(message.id));

        // const results = [];

        // for (const message of orphanedMessages) {
        //     const result = await saveOnApproval(message, emojiName, days, threshold);
        //     results.push(results);
        // }

        // return results;
    }

    async function createNewQuote(quoteMessage, botMessage, emojiName, days, threshold, quoteExtractionCallback, callback) {
        const quote = quoteExtractionCallback(quoteMessage);

        if (await funcs.checkIfOrphan(quoteMessage.id)) {
            throw new Error('Message is already approved.');
        }

        const sub = (await createReactionObservable(botMessage, emojiName, days, threshold)).subscribe(
            async () => {
                const results = await funcs.createQuote(quoteMessage.author.id, quoteMessage.id, quote.content, quote.author, quote.year);
                delete pending[quoteMessage.id];
                callback(null, results);
            },
            err => {
                delete pending[quoteMessage.id];
                callback(err);
            }
        );

        return (pending[quoteMessage.id] = { sub, quote, message: quoteMessage, emojiName, threshold });
    }

    return { createNewQuote, sweepMessagesForOrphans };
}