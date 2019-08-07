const Discord = require('discord.js');
const { prefix, token, channel } = require('./config.json');
const client = new Discord.Client();

const sequelize = require('./db/models');

client.once('ready', async () => {
    await sequelize.sync({ force: true });
    console.log('Bot Online!');
});

client.on('message', message => {

    if(message.content.startsWith(`${prefix} receive`)){
        message.delete();
        if(message.channel.name == channel){
            message.reply('_Wisdom can only be received from other channels_')
                    .then(msg =>
                        msg.delete(5000));
            message.channel.delete(message.channel.lastMessage);
        }
        else{
            message.channel.send('**Random Quote**');   
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
            else{
                user = message.author

                vote = await message.awaitReactions(reaction => {
                    return reaction.emoji.name === "🤔",time(6.048e+8);
                });              
                console.log(vote.count);

                message.channel.send(`**${quote}** _heard by_ ***${user}*** \n __*Please react 🤔 to approve and add to database. 3 upvotes within a week required to approve.*__`)
                .then(sentEmbed => {
                    sentEmbed.react("🤔")
                });
                //add reactor collector here
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