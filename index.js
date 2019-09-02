require('dotenv').config()

const Discord = require('discord.js');
const { DISCORD_TOKEN, DISCORD_PREFIX, DISCORD_CHANNEL } = process.env;
const client = new Discord.Client();

const { sequelize } = require('./db/models');

function quoteDataExtractor(message) {
    return {
        content: message.content.replace(`${ DISCORD_PREFIX } add `,''),
        author: 'Morales',
        year: 2019
    };
}

const quoteManager = require('./services/quote-manager.service')(client, '🤔', 7, 1, quoteDataExtractor, DISCORD_CHANNEL);

client.once('ready', async () => {
    await sequelize.sync();
    console.log('Bot Online! Recovering orphans.');
    quoteManager.recoverOrphans();
});

client.on('message', async message => {

    if(message.content.startsWith(`${ DISCORD_PREFIX } receive`)){
        // message.delete();
        if(message.channel.name == DISCORD_CHANNEL){
            message.reply('_Wisdom can only be received from other channels_')
                    .then(msg =>
                        msg.delete(5000));
            message.channel.delete(message.channel.lastMessage);
        }
        else{
            quoteManager.receiveQuote(message);
        }
    }

    if(message.content.startsWith(`${ DISCORD_PREFIX } help`)){
        // message.delete();
        if(message.channel.name == DISCORD_CHANNEL){
            message.reply('Help can only be sent through other channels_')
                    .then(msg =>
                        msg.delete(5000));
            message.channel.delete(message.channel.lastMessage);
        }
        else{
            message.channel.send('>>> Wisdom Bot Commands\n\n**!wisdom receive** - to summon a quote through vape tricks. \n**!wisdom add quote** - to add knowledge to the database. _Works only in_ ***jolo-transcript***' );   
        }
    }
    
    if(message.content.startsWith(`${ DISCORD_PREFIX } add`)){
        // message.delete();
        if(message.channel.name == DISCORD_CHANNEL){
            quote = message.content.replace(`${ DISCORD_PREFIX } add`,'');
            if(quote.length == 0){
                message.reply('_Error! There is no quote_')
                    .then(msg =>
                        msg.delete(5000));
            }
            else {
                quoteManager.submitQuote(message);
            }
        }
        else{
            message.reply(`Please use the ${ DISCORD_CHANNEL }`)
                    .then(msg =>
                        msg.delete(5000));
        }
    }
})

client.login(DISCORD_TOKEN);