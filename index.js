const Discord = require('discord.js');
const { prefix, token, channel } = require('./config.json');
const client = new Discord.Client();

const { sequelize } = require('./db/models');
const { getRandomQuote } = require('./db/funcs/quote.func');

const reactService = require('./services/react.service')(client);

let VOTE_EMOJI = '🤔';

function quoteDataExtractor(message) {
    return {
        content: message.content.replace(`${prefix} add`,''),
        author: 'Jolo Morales',
        year: 2019
    };
}

async function addQuote(quoteMessage) {
    const user = quoteMessage.author;
    const botMessage = await quoteMessage.channel.send(`**${quote}** _heard by_ ***${user}*** \n __*Please react 🤔 to approve and add to database. 3 upvotes within a week required to approve.*__`)

    await reactService.createNewQuote(
        quoteMessage,
        botMessage,
        VOTE_EMOJI,
        7,
        3,
        quoteDataExtractor,
        (err, res) => {
            if (err) {
                quoteMessage.channel.send(`The quote was not saved in the db.`);
                return;
            }

            quoteMessage.channel.send('Quote saved.');
        }
    );

    botMessage.react('🤔');
}

client.once('ready', async () => {
    await sequelize.sync();
    console.log('Bot Online!');
});

client.on('message', async message => {

    if(message.content.startsWith(`${prefix} receive`)){
        message.delete();
        if(message.channel.name == channel){
            message.reply('_Wisdom can only be received from other channels_')
                    .then(msg =>
                        msg.delete(5000));
            message.channel.delete(message.channel.lastMessage);
        }
        else{
            message.channel.send((await getRandomQuote()).content);   
        }
    }
    
    if(message.content.startsWith(`${prefix} add`)){
        message.delete();
        if(message.channel.name == channel){
            quote = message.content.replace(`${prefix} add`,'');
            if(quote.length == 0){
                message.reply('_Error! There is no quote_')
                    .then(msg =>
                        msg.delete(5000));
            }
            else {
                addQuote(message);
            }
        }
        else{
            message.reply(`Please use the ${channel}`)
                    .then(msg =>
                        msg.delete(5000));
        }
    }
})

client.login(token);