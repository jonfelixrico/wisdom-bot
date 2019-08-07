const models = require('../models'),
    quoteFuncs = require('./quote.func'),
    userFuncs = require('./user.func'),
    uuid = require('short-uuid').generate;

async function demo() {
    try {
        await models.sequelize.sync({ force: true });
        console.log('Beginning tests!');
        const quote = await quoteFuncs.createQuote(uuid(), uuid(), 'Ika nga', 'Jolo Morales', 2019);

        const user = await quote.getUser();
        console.log(user);

        const muteFlag = await user.getActiveMuteFlag();
        console.log(muteFlag);

        console.log(await quoteFuncs.getRandomQuote());
    } catch (err) {
        console.log(err);
    }
}

demo();

