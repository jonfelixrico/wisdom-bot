const Discord = require('discord.js');
const { prefix, token, channel } = require('./config.json');
const client = new Discord.Client();

const { sequelize } = require('./db/models');
const quoteManager = require('./services/quote-manager.service')(client);

const VOTE_EMOJI = '🤔',
    VOTES_REQUIRED = 3,
    VOTING_DAYS = 7;


function quoteDataExtractor(message) {
    return {
        content: message.content.replace(`${prefix} add `,''),
        author: 'Morales',
        year: 2019
    };
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
            quoteManager.receiveQuote(message.channel);
        }
    }

    if(message.content.startsWith(`${prefix} help`)){
        message.delete();
        if(message.channel.name == channel){
            message.reply('Help can only be sent through other channels_')
                    .then(msg =>
                        msg.delete(5000));
            message.channel.delete(message.channel.lastMessage);
        }
        else{
            message.channel.send('>>> Wisdom Bot Commands\n\n**!wisdom receive** - to summon a quote through vape tricks. \n**!wisdom add quote** - to add knowledge to the database. _Works only in_ ***jolo-transcript***' );   
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
                quoteManager.submitQuote(message, VOTE_EMOJI, VOTING_DAYS, VOTES_REQUIRED, quoteDataExtractor);
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