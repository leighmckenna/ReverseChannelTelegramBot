import { Bot, InlineKeyboard } from 'grammy';
import { AppUser, Channel } from './schema';
import { v4 as uuidv4 } from 'uuid';

const bot = new Bot(process.env.BOT_TOKEN);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

// Populate new user
bot.command('start', (ctx) => {
    if (ctx.from) {
        userList.push(<AppUser>{
            UUID: ctx.from.id,
            nameOnMsg: ctx.from.first_name,
            channelsOwned: [] as string[],
            channelsModded: [] as string[],
            channelsSender: [] as string[],
            isBanned: false
        });


        ctx.reply("Hello, " + ctx.from.first_name + ", \n\n Thank you for using this bot, you have been registered.\n\n In order to get started, either join a channel with /joinchat followed by the code you were given, or make a channel with /newchannel.");
        if (process.env.NODE_ENV == 'dev'){
            console.log(JSON.stringify(userList[userList.length-1]));
            console.log("User logged at index: " + (userList.length-1));
        }
    }
});

// Create a new channel
bot.command('newchannel', (ctx) => {
    if (ctx.from) {
        if (userHasChannel(ctx.from.id)) {
            // true, user has a channel
            //say no and tell them they have one
        } else {
            let newChannelLength: number = chanList.push(
                <Channel>{
                    UUID: getUUID(),
                    owner: ctx.from.id,
                    mods: [] as number[],
                    senders: [] as number[],
                    senderAlias: new Map<string, number>(),
                    joinLink: getUUID()
                }
            );

            ctx.reply("Alrighty, " + ctx.from.first_name + ", a new channel directed at you has been set up! In order to let people join, have them message this bot and sent this message: \n\n/joinchannel " + chanList[chanList.length - 1].joinLink + "\n\n After that, they'll be able to send you anonymous via this bot.");
        }
    }
});

// Join an existing channel via code
bot.command('joinchannel', (ctx) => {
    if (ctx.from) {
        let joinCode: string = ctx.message.text.substring(13);
        let channelInd = getChannelFromJoin(joinCode);
        let userInd = getUser(ctx.from.id);
        // if the number exists and is within the bounds of normalcy
        if (channelInd != null && channelInd >= 0 && channelInd < chanList.length) {
            // add channel to user's default list
            userList[userInd].channelsSender.push(chanList[channelInd].UUID);
            // add user to the channel's allowed senders list
            chanList[channelInd].senders.push(userList[userInd].UUID);

            ctx.reply("Alrighty, " + ctx.from.first_name + ", you've joined a channel that forwards to:" + getUser(chanList[channelInd].owner));
        } else {
            ctx.reply("Oops, looks like that's not a valid code! Try again.");
        }
    }
});

// menu for channel management
bot.command('managechannel', (ctx) => {
    // NYE
});

// bot.command('messagechannel', (ctx) => {
//     // list channels via inline bot (index them based on where they are in user's chatSender)
//     if (!ctx.from) {
//         return; // this is stupid
//     }
//     const InlineChannelMenu = new InlineKeyboard();

//     let currentUser = userList[getUser(ctx.from.id)];

//     for (let i = 0; i < currentUser.chatSender.length; i++) {
//         InlineChannelMenu.text( (i+1) + ": " + getOwnerNameFromChannel(currentUser.chatSender[i]), "");
//     }
// })


// deal with non-command user messages
bot.on('message', (ctx) => {
    // if(userList[ctx.from.id].currentAction){
        // let chanIndex = getChannel(userList[ctx.from.id].currentAction);
        // verify user has send access to channel
        // if (chanList[chanIndex].senders.includes(ctx.from.id)){
// whatever goes in here to actually send the message
        // }
// 
    // } else {
        // ctx.reply("You have no selected channel. Please select a channel with /messagechannel.");
    // }
})

// start bot
bot.start();

// Enable graceful stop
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

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

// Returns the index of the user that has the UUID specified
function getUser(UUID: number): number {
    return userList.findIndex(AppUser => AppUser.UUID === UUID);
}

// Returns the index of the channel that has the UUID specified
function getChannel(UUID: string): number {
    return chanList.findIndex(Channel => Channel.UUID === UUID);
}

// Returns the index of the channel the user is trying to join
function getChannelFromJoin(joinCode: string): number {
    return chanList.findIndex(Channel => Channel.joinLink === joinCode);
}

// 
function getOwnerNameFromChannel(UUID: string): string {
    // get the channel
    let channelInd = getChannel(UUID);
    // get the owner
    let ownerInd = getUser(chanList[channelInd].owner);
    // get the owner's name and return
    return userList[ownerInd].nameOnMsg;
}

// Returns true if the channel exists and else otherwise
function userHasChannel(UUID: number): boolean {
    let channel = chanList.findIndex(Channel => Channel.owner === UUID);
    if (channel != undefined) {
        // if the channel IS NOT undefined (exists)
        return true;
    } else {
        // if the channel IS undefined
        return false;
    }
}
