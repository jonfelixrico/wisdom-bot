const funcs = require('../db/funcs/quote.func'),
    { Subject, timer, merge, of, throwError } = require('rxjs'),
    { filter, takeUntil, map, finalize } = require('rxjs/operators'),
    moment = require('moment');

module.exports = function(client) {

    const subscriptions = {};

    
    function countReacts(message, emoji) {
        // fetch the MessageReaction instance from the Message instance
        // with an emoji that matches the ID of the specified one in this func
        const reaction = message.reactions[emoji.id];

        // if the reaction is null, then we return 0 since it means there is no reaction for the message
        // that matches the specified emoji

        // else, we get the users from the MessageReaction and then we count the number of users that reacted.
        // we do NOT include the author of the message in the count, if ever they reacted in their own message
        return !reaction ? 0 : reaction.users.keyArray().filter(id => id !== message.author.id).length;
    }

    function fetchMessageChannel(message) {
        return client.channels[message.channel.id];
    }

    async function createReactionObservable(message, emoji, days, threshold) {
        // get the message's text channel
        const textChannel = fetchMessageChannel(message);

        const createdAt = moment(message.createdAt);
        const timerValue = createdAt.diff(createdAt.add(days)).toDate();

        // create an subject with its initial value set to the number of
        // reacts in the message that matches the emoji
        const reactSubject = new Subject(countReacts(message, emoji));

        // create a message collector instance
        const collector = message.createReactionCollector();

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
            reactSubject.next(countReacts(fetchedMessage, emoji));
        });

        // create an observable that will complete/emit if the threshold is reached
        const thresholdReached$ = reactSubject.asObservable().pipe(
            filter(res => res === threshold),
            takeUntil(res => res === threshold)
        );

        return merge(
            thresholdReached$.pipe(map(() => message.id)),
            timer(timerValue).pipe(throwError('Approval window is already over.'))
        ).pipe(
            take(1), // emit only once, then complete the observable
            finalize(() => {
                // stop listening for reactions on completion
                collector.stop();
            })
        );
    }

    async function sweepMessagesForOrphaned(channel, emoji, days, threshold, quoteExtractionCallback) {
        const messages = await channel.fetchMessages();
        const orphanIds  = new Set(await funcs.checkIfOrphanMulti(messages.keyArray()));

        const orphanedMessages = messages.array().filter(message => orphanIds.has(message.id));

        const subs = [];

        for (const message of orphanedMessages) {
            const sub = await saveOnApproval(message, emoji, days, threshold);
            subs.push(sub);
        }

        return subs;
    }

    async function saveOnApproval(message, emoji, days, threshold, quoteExtractionCallback) {
        const quote = quoteExtractionCallback(message);

        if (await funcs.checkIfOrphan(message.id)) {
            throw new Error('Message is already approved.');
        }

        const sub = subscriptions[message.id] = createReactionObservable(message, emoji, days, threshold).subscribe(
            async () => {
                await funcs.createQuote(message.user.id, message.id, quote.content, quote.author, quote.year);
                console.log('A quote was saved to the database.');
                delete subscriptions[message.id];
            },
            err => {
                console.log(err);
                delete subscriptions[message.id];
            }
        );

        return sub;
    }

    return { saveOnApproval };
}