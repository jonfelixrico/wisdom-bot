const { BehaviorSubject, timer, of, merge } = require('rxjs'),
    { filter, map, finalize, takeUntil, throwError, take, concatMap, tap } = require('rxjs/operators');

module.exports = function(message, emojiName, expiresAt, votesRequired, blacklist) {
    blacklist = new Set(blacklist || []);
    expiresAt = new Date(expiresAt);

    if (new Date() >= expiresAt) {
        return throwError('Quote approval period is already expired.');
    }

    function countInitReacts() {
        // fetch all the 'react types' in a message and leave only the one with the emoji name.
        //  this constant either has an empty array or an array with a single element
        const reaction = message.reactions.array().filter(reacts => reacts.emoji.name === emojiName);

        // if the array of the reaction cosnst is empty, return 0
        if (!reaction.length) {
            return 0;
        }

        // we return the number of users that reacted with the correct emoji
        // blacklisted users does not count
        return reaction[0].users.keyArray().filter(id => !blacklist.has(id)).length;
    }

    const reactSubject = new BehaviorSubject(countInitReacts(message, emojiName, blacklist));

    if (reactSubject.value >= votesRequired) {
        return of(true);
    }

    const collector = message.createReactionCollector((reaction) => reaction.emoji.name === emojiName);

    collector.on('collect', async reaction => {
        reactSubject.next(reaction.users.keyArray().filter(id => !blacklist.has(id)).length);
    });

    const thresholdReached$ = reactSubject.asObservable().pipe(
        filter(res => res === votesRequired),
        map(() => true),
        take(1)
    );

    const onReact$ = reactSubject.asObservable();

    const windowOver$ = timer(expiresAt).pipe(concatMap(() => throwError('Quote failed to get enough reacts within the approval period.')));

    return merge(onReact$, windowOver$).pipe(
        takeUntil(thresholdReached$),
        finalize(() => {
            collector.stop();
        })
    );
}