import { Context, Telegraf } from 'telegraf';
import { AppUser, Channel } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { token, ownerUUID } from './config';
import { channel } from 'diagnostics_channel';

const bot = new Telegraf(token);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

// Populate new user
bot.start((ctx) => {
    userList.push(<AppUser> {
        UUID: ctx.from.id,
        nameOnMsg: ctx.from.first_name,
        chatOwned: [] as string[],
        chatModed: [] as string[],
        chatSender: [] as string[],
        banned: false
    })
    
    ctx.reply("Hello, " + ctx.from.first_name + ", \n\n Thank you for using this bot, you have been registered.\n\n In order to get started, either join a channel with /joinchat followed by the code you were given, or make a channel with /newchannel.");

});

// Create a new channel
bot.command('newchannel', (ctx) => {
    let newChannelLength:number = chanList.push(
        <Channel> {
            UUID: getUUID(),
            owner: ctx.from.id,
            ops: [] as number[],
            senders: [] as number[],
            senderAlias: new Map<string, number>(),
            joinLink: getUUID()
        }
    );

    ctx.reply("Alrighty, " + ctx.from.first_name + ", a new channel directed at you has been set up! In order to let people join, have them message this bot and sent this message: \n\n/joinchannel " + chanList[chanList.length-1].joinLink + "\n\n After that, they'll be able to send you anonymous via this bot.");
    
});

// Join an existing channel via code
bot.command('joinchannel', (ctx) => {
    let joinCode: string = ctx.message.text.substring(13);
    let channelInd = getChannelFromJoin(joinCode);
    let userInd = getUser(ctx.from.id);
    // if the number exists and is within the bounds of normalcy
    if (channelInd != null && channelInd >= 0 && channelInd < chanList.length) {
        // add channel to user's default list
        userList[userInd].chatSender.push(chanList[channelInd].UUID);
        // add user to the channel's allowed senders list
        chanList[channelInd].senders.push(userList[userInd].UUID);

        ctx.reply("Alrighty, " + ctx.from.first_name + ", you've joined a channel that forwards to:" + getUser(chanList[channelInd].owner));
    } else {
        ctx.reply("Oops, looks like that's not a valid code! Try again.");
    }
});


// start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

////////////////////////////////////////////////////
//
//              utility functions
//
/// functions to support above methods and help 
///        make things more readable 
//
////////////////////////////////////////////////////

// Generates a UUID from the UUID package
function getUUID(): string {
    return uuidv4();
}

function getUser(UUID: number): number {
    return userList.findIndex( AppUser => AppUser.UUID === UUID);
}

function getChannel(UUID: string): number {
    return chanList.findIndex( Channel => Channel.UUID === UUID);
}

function getChannelFromJoin(joinCode: string): number {
    return chanList.findIndex( Channel => Channel.joinLink === joinCode);
}
