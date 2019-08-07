const { BehaviorSubject, timer, of, merge } = require('rxjs'),
    { filter, map, finalize, take } = require('rxjs/operators'),
    moment = require('moment');

module.exports = function(client) {

    function countReacts(targetMessage, emojiName, reactorBlacklist) {
        const blacklist = new Set(reactorBlacklist || []);
        const reaction = targetMessage.reactions.array().filter(reacts => reacts.emoji.name === emojiName);

        if (reaction.length) {
            count = reaction[0].users.keyArray().filter(id => !blacklist.has(id));
        }

        return !reaction.length ? 0 : reaction[0].users.keyArray().filter(id => !blacklist.has(id)).length;
    }

    return function createReactionObservable(targetMessage, emojiName, approvalWindow, minimumVotesRequired, reactorBlacklist) {
        const channel = targetMessage.channel;
        reactorBlacklist = reactorBlacklist || [];

        const createdAt = moment(targetMessage.createdAt);
        const timerValue = createdAt.add(approvalWindow, 'days').toDate();


        const reactSubject = new BehaviorSubject(countReacts(targetMessage, emojiName, reactorBlacklist));

        const collector = targetMessage.createReactionCollector(() => true);

        if (reactSubject.value >= minimumVotesRequired) {
            return of(true);
        } else if (timerValue < new Date()) {
            return of(false);
        }

        collector.on('collect', async () => {
            const fetchedMessage = await channel.fetchMessage(targetMessage.id);
            reactSubject.next(countReacts(fetchedMessage, emojiName));
        });

        const thresholdReached$ = reactSubject.asObservable().pipe(
            filter(res => res === minimumVotesRequired),
            map(() => true),
            take(1)
        );

        const windowOver$ = timer(timerValue).pipe(
            map(() => {
                throw new Error('Window for approval is already over!');
            })
        );

        return merge(thresholdReached$, windowOver$).pipe(
            take(1),
            finalize(() => {
                collector.stop();
            })
        );
    }
}