import { Api, Bot, Context, InlineKeyboard } from 'grammy';
import { AppUser, Channel } from './schema';
import { getUUID, getUser, getChannel, getChannelFromJoin, 
         userHasChannel, generateAlias } from './utility';
import { sendMessage, sendBroadcastText, replyToSenderText, 
         sendToOwnerText, sendBroadcastSticker, 
         replyToSenderSticker, sendToOwnerSticker 
         } from './messageHandling';

// @TODO: Make MessageType Enum
enum MessageType {
    Text,
    Sticker,
    Photo,
}

const bot = new Bot(process.env.BOT_TOKEN);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

// Populate new user
bot.command('start', (ctx) => {
    // checks to see if the user exists and is already in the list
    // getUser returns -1 if the user does not exist
    if (ctx.from && getUser(ctx.from.id, userList) == -1) {
        userList.push(<AppUser>{
            UUID: ctx.from.id,
            chatID: ctx.chat.id,
            nameOnMsg: ctx.from.first_name,
            channelsOwned: [] as string[],
            channelsModded: [] as string[],
            channelsSender: [] as string[],
            isBanned: false
        });

        if (process.env.NODE_ENV == 'dev'){
            console.log(JSON.stringify(userList[userList.length-1]));
            console.log("User logged at index: " + (userList.length-1));
        }

        ctx.reply("Hello, " + ctx.from.first_name + ", \n\n Thank you for using this bot, you have been registered.\n\n In order to get started, either join a channel with /joinchat followed by the code you were given, or make a channel with /newchannel.");
    }
    else if (ctx.from) {
        ctx.reply("Hello, " + ctx.from.first_name + ", it looks like you already exist and don't need to run /start.");
    }
    else {
        ctx.reply("According to telegram, no one sent this message. Please try again or contact the owner of the bot.");
    }
});

// Create a new channel
bot.command('newchannel', (ctx) => {
    if (ctx.from) {
        if (getUser(ctx.from.id, userList) > -1) {
            ctx.reply("Creating a new channel...");
            if (userHasChannel(ctx.from.id, chanList)) {
                // true, user has a channel
                //say no and tell them they have one
                ctx.reply("user has channel");
            } else {
                // create a new channel and add it to the channel list
                let newChannel = <Channel>{
                    UUID: getUUID(),
                    owner: ctx.from.id,
                    mods: [] as number[],
                    senders: [] as number[],
                    senderAlias: new Map<string, number>(),
                    senderAliasReverse: new Map<number, string>(),
                    joinLink: getUUID()
                };
                let newChannelLength: number = chanList.push(newChannel);

                // add the channel to the user's owned channels
                let thisUser = userList[getUser(ctx.from.id, userList)];
                thisUser.channelsOwned.push(newChannel.UUID)

                // set channel as the active channel
                thisUser.activeChannel = newChannel.UUID;
                
                ctx.reply("Alrighty, " + ctx.from.first_name + ", a new channel directed at you has been set up! In order to let people join, have them message this bot and sent this message: \n\n/joinchannel " + chanList[chanList.length - 1].joinLink + "\n\n After that, they'll be able to send you anonymous via this bot.");
            }
        } else {
            ctx.reply("Whoa there, something went wrong. Try using /start first.");
        }
        
    }
});

// Join an existing channel via code
// @TODO: Error validation - What happens if the user hasn't called /start?
bot.command('joinchannel', (ctx) => {
    if (ctx.from) {
        if (getUser(ctx.from.id, userList) > -1) {
            let joinCode: string = ctx.message.text.substring(13);
            let channelInd = getChannelFromJoin(joinCode, chanList);
            let userInd = getUser(ctx.from.id, userList);
            // if the number exists and is within the bounds of normalcy
            if (channelInd != null && channelInd >= 0 && channelInd < chanList.length) {
                // add channel to user's default list
                userList[userInd].channelsSender.push(chanList[channelInd].UUID);
                // add user to the channel's allowed senders list
                chanList[channelInd].senders.push(userList[userInd].UUID);
                // switch user's active channel
                userList[userInd].activeChannel = chanList[channelInd].UUID;
                // give user an alias
                let alias = generateAlias();
                chanList[channelInd].senderAlias.set(alias, ctx.from.id);
                chanList[channelInd].senderAliasReverse.set(ctx.from.id, alias);

                ctx.reply("Alrighty, " + ctx.from.first_name + 
                          ", you've joined a channel that forwards to:" + 
                          userList[getUser(chanList[channelInd].owner, userList)].nameOnMsg);
            } else {
                ctx.reply("Oops, looks like that's not a valid code! Try again.");
            }

            if (process.env.NODE_ENV == 'dev'){
                console.log(JSON.stringify(userList[userInd]));
                console.log("User joined channel at index: " + (userInd));
            }
        } else {
            ctx.reply("Whoa there, something went wrong. Try using /start first.");
        }

        
    }

    
});

// menu for channel management
bot.command('managechannel', (ctx) => {
    // NYE
});

// deal with non-command user text messages
bot.on('message:text', (ctx) => {
    console.log("message received, sending...")
    console.log(JSON.stringify(userList));
    sendMessage(ctx, replyToSenderText, sendBroadcastText, sendToOwnerText, userList, chanList);
});

bot.on('message:sticker', (ctx) => {
    sendMessage(ctx, replyToSenderSticker, sendBroadcastSticker, sendToOwnerSticker, userList, chanList);
})

// start bot
bot.start();

// Enable graceful stop
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
