import { Api, Bot, InlineKeyboard } from 'grammy';
import { AppUser, Channel } from './schema';
import { v4 as uuidv4 } from 'uuid';
import data from './wordList.json';


const bot = new Bot(process.env.BOT_TOKEN);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

// Populate new user
bot.command('start', (ctx) => {
    // checks to see if the user exists and is already in the list
    // getUser returns -1 if the user does not exist
    if (ctx.from && getUser(ctx.from.id) == -1) {
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

/* test method pls ignore
bot.command('listchannels', (ctx) => {
    ctx.reply("there are " + chanList.length + " channels");
    for (let channel of chanList) {
        ctx.reply(channel.owner.toString());
    }
    ctx.reply("done listing channels");
    
}); 
*/ 

// Create a new channel
bot.command('newchannel', (ctx) => {
    ctx.reply("Creating a new channel...");
    if (ctx.from) {
        ctx.reply("we received your command");
        if (userHasChannel(ctx.from.id)) {
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
                joinLink: getUUID()
            };
            let newChannelLength: number = chanList.push(newChannel);

            // add the channel to the user's owned channels
            let thisUser = userList[getUser(ctx.from.id)];
            thisUser.channelsOwned.push(newChannel.UUID)

            // set channel as the active channel
            thisUser.activeChannel = newChannel.UUID;
            
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
            // switch user's active channel
            userList[userInd].activeChannel = chanList[channelInd].UUID;

            ctx.reply("Alrighty, " + ctx.from.first_name + ", you've joined a channel that forwards to:" + userList[getUser(chanList[channelInd].owner)].nameOnMsg);
        } else {
            ctx.reply("Oops, looks like that's not a valid code! Try again.");
        }

        if (process.env.NODE_ENV == 'dev'){
            console.log(JSON.stringify(userList[userInd]));
            console.log("User joined channel at index: " + (userInd));
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
    
    // if user is in a channel
    if(userList[getUser(ctx.from.id)].activeChannel){
        
        let chanIndex = getChannel(userList[getUser(ctx.from.id)].activeChannel);
        let myChannel = chanList[chanIndex];
        
        // check if user owns channel
        if (myChannel.owner == ctx.from.id){
            // check if message is a broadcast or reply
            if (ctx.message.reply_to_message){
                // message is a reply, send to singular user

                

            } else {
                // message is not a reply, broadcast to all users
                // @TODO: Add support for media
                for (let userID of myChannel.senders) {
                    let user = userList[getUser(userID)];
                    if (ctx.message.text) {
                        let owner = userList[getUser(myChannel.owner)];
                        let username = owner.nameOnMsg;
                        let wrappedMessage = "<" + username + "> " + ctx.message.text;
                        ctx.api.sendMessage(user.chatID, wrappedMessage);
                    }
                }
            }
        }
        // verify user has send access to channel
        
        /*else*/ if (myChannel.senders.includes(ctx.from.id)){
            let owner = userList[getUser(myChannel.owner)];
            if (ctx.message.text) {
                ctx.api.sendMessage(owner.chatID, ctx.message.text);
            }
        } 
    // user is not in a channel
    } else {
        ctx.reply("You have no selected channel. Please select a channel with /messagechannel.");
    }
    
    ctx.reply("You wrote: " + ctx.message.text);
});

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

// Returns the username extracted from a user's message
function getUserFromMessage(message: string): string | null {
    let re = new RegExp('<(.*)>');
    let resultArray = re.exec(message);
    if (resultArray) {
        let result = resultArray[0];
        if (process.env.NODE_ENV == 'dev'){
            console.log(result);
        }
        return result;
    }
    return null;
}

// Returns true if the message is a forwarded user message, false if bot message
function isUserMessage(message: string): boolean {
    let re = new RegExp("^<");
    return message.search(re) >= -1;
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
    if (channel != -1) {
        // if the channel IS NOT undefined (exists)
        return true;
    } else {
        // if the channel IS undefined
        return false;
    }
}

function generateAlias(): string {
    let alias = "";

    let adjList = data.adj;
    let nounList = data.noun;

    alias += adjList[Math.floor(Math.random() * adjList.length)];
    alias += nounList[Math.floor(Math.random() * nounList.length)];

    return alias;
}
