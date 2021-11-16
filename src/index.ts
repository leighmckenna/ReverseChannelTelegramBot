import { Api, Bot, Context, InlineKeyboard } from 'grammy';
import { AppUser, Channel } from './schema';
import { v4 as uuidv4 } from 'uuid';
import data from './wordList.json';

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
    if (ctx.from) {
        if (getUser(ctx.from.id) > -1) {
            ctx.reply("Creating a new channel...");
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
                    senderAliasReverse: new Map<number, string>(),
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
        } else {
            ctx.reply("Whoa there, something went wrong. Try using /start first.");
        }
        
    }
});

// Join an existing channel via code
// @TODO: Error validation - What happens if the user hasn't called /start?
bot.command('joinchannel', (ctx) => {
    if (ctx.from) {
        if (getUser(ctx.from.id) > -1) {
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
                // give user an alias
                let alias = generateAlias();
                chanList[channelInd].senderAlias.set(alias, ctx.from.id);
                chanList[channelInd].senderAliasReverse.set(ctx.from.id, alias);

                ctx.reply("Alrighty, " + ctx.from.first_name + ", you've joined a channel that forwards to:" + userList[getUser(chanList[channelInd].owner)].nameOnMsg);
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


// deal with non-command user text messages
bot.on('message:text', (ctx) => {
    sendMessage(ctx, replyToSenderText, sendBroadcastText, sendToOwnerText);
});

bot.on('message:sticker', (ctx) => {
    sendMessage(ctx, replyToSenderSticker, sendBroadcastSticker, sendToOwnerSticker);
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

// Returns the telegram user ID of a sender based on their alias
function getIDfromSender(user: string, channelID: string): number | undefined {
    if (chanList[getChannel(channelID)].senderAlias.get(user)) {
        return chanList[getChannel(channelID)].senderAlias.get(user);
    }
    return undefined;
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
    let re = new RegExp('(?<=<).*(?=>)');
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

// Determines who a message is being sent to and from, then sends message accordingly using provided function pointers
function sendMessage(ctx: Context, replyToSender: Function, sendBroadcast: Function, sendToOwner: Function) {
    if (ctx.from && ctx.message && getUser(ctx.from.id) > -1) {
        // if user is in a channel
        if(userList[getUser(ctx.from.id)].activeChannel){

            let user = userList[getUser(ctx.from.id)];
            let channel = chanList[getChannel(user.activeChannel)];
            
            // check if user owns channel
            if (channel.owner == ctx.from.id){
                // user owns channel
                // check if message is a broadcast or reply
                if (ctx.message.reply_to_message){
                    // message is a reply
                    if (ctx.message.reply_to_message.sticker) {
                        ctx.reply("Error: Cannot reply to a sticker. Reply to the header above it instead.")
                    } else {
                        replyToSender(ctx, user, channel);
                    }
                } else {
                    // message is a broadcast
                    sendBroadcast(ctx, user, channel);
                }
            } else if (channel.senders.includes(ctx.from.id)){
                // user does not own channel
                // send message to channel owner
               sendToOwner(ctx, user, channel);

            // user is not in a channel
            } else {
                ctx.reply("You have no selected channel. Please select a channel with /messagechannel.");
            }
        }
    }
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

// Generate a random alias from the provided list of adjectives and nouns
function generateAlias(): string {
    let alias = "";

    let adjList = data.adj;
    let nounList = data.noun;

    alias += adjList[Math.floor(Math.random() * adjList.length)];
    alias += nounList[Math.floor(Math.random() * nounList.length)];

    return alias;
}

// Send a text message from the owner of a channel to all members of the channel
function sendBroadcastText(ctx: Context, owner: AppUser, channel: Channel) {
    if (ctx.message){
        // send to every member of a channel
        for (let senderID of channel.senders) {
            let user = userList[getUser(senderID)];
            if (ctx.message.text) {
                let username = owner.nameOnMsg;
                let wrappedMessage = "\<" + username + "\>: " + ctx.message.text;
                ctx.api.sendMessage(user.chatID, wrappedMessage);
            }
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

// Send a text message from the owner of a channel to a specific user as a reply
function replyToSenderText(ctx: Context, owner: AppUser, channel: Channel) {
    if (ctx.message && ctx.message.reply_to_message && ctx.from ){
        if (ctx.message.reply_to_message.text && isUserMessage(ctx.message.reply_to_message.text)) {
            // owner is replying to a user message
            let sender = getUserFromMessage(ctx.message.reply_to_message.text);
            if (sender) {
                let senderID = getIDfromSender(sender, userList[getUser(ctx.from.id)].activeChannel);
                if (senderID) {
                    console.log("Sender is " + sender + " with ID " + senderID)
                    let user = userList[getUser(senderID)];
                    let owner = userList[getUser(channel.owner)];
                    let username = owner.nameOnMsg;
                    let wrappedMessage = "_\<" + username + "\\>:_ " + ctx.message.text;
                    ctx.api.sendMessage(user.chatID, wrappedMessage, {
                        parse_mode: "MarkdownV2",
                    });
                }
            }
        // owner is erroneously trying to reply to the bot
        } else if (ctx.message.text) {
            ctx.reply("I'm sorry, messages cannot be broadcast as replies.");
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

// Send a text message from a user of a channel to the owner of the channel
function sendToOwnerText(ctx: Context, sender: AppUser, channel: Channel) {
    let owner = userList[getUser(channel.owner)];
    if (ctx.message && ctx.message.text && ctx.from) {
        if (process.env.NODE_ENV == 'dev'){
            console.log(JSON.stringify(channel));
        }
        let alias = channel.senderAliasReverse.get(sender.UUID);
        let wrappedMessage = "\<" + alias + "\\>: " + ctx.message.text;
        ctx.api.sendMessage(owner.chatID, wrappedMessage, {
            parse_mode: "MarkdownV2",
        });
    } else {
        ctx.reply("Something went wrong, please try again.");
    }   
}

// Send a sticker message from the owner of a channel to all members of the channel
function sendBroadcastSticker(ctx: Context, owner: AppUser, channel: Channel) {
    if (ctx.message && ctx.message.sticker){
        for (let senderID of channel.senders) {
            let user = userList[getUser(senderID)];
            let username = owner.nameOnMsg;
            let wrappedMessage = "\<" + username + "\\>: ";
            sendSticker(ctx, user.chatID, wrappedMessage, ctx.message.sticker.file_id);
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

// Send a sticker message from the owner of a channel to a specific user as a reply
function replyToSenderSticker(ctx: Context, owner: AppUser, channel: Channel) {
    if (ctx.message && ctx.message.reply_to_message && 
        ctx.from && ctx.message.sticker){
        if (ctx.message.reply_to_message.text && isUserMessage(ctx.message.reply_to_message.text)) {
            // owner is replying to a user message
            let sender = getUserFromMessage(ctx.message.reply_to_message.text);
            if (sender) {
                let senderID = getIDfromSender(sender, owner.activeChannel);
                if (senderID) {
                    let user = userList[getUser(senderID)];
                    let owner = userList[getUser(channel.owner)];
                    let username = owner.nameOnMsg;
                    let wrappedMessage = "_\<" + username + "\\>:_ ";
                    sendSticker(ctx, user.chatID, wrappedMessage, ctx.message.sticker.file_id);
                }
            }
        // owner is trying to reply to the bot
        } else if (ctx.message.text) {
            ctx.reply("I'm sorry, messages cannot be broadcast as replies.");
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

// Send a sticker message from a user of a channel to the owner of the channel
function sendToOwnerSticker(ctx: Context, sender: AppUser, channel: Channel) {
    let owner = userList[getUser(channel.owner)];
    if (ctx.message && ctx.message.sticker && ctx.from) {
        let alias = channel.senderAliasReverse.get(sender.UUID);
        let wrappedMessage = "\<" + alias + "\\>: ";
        sendSticker(ctx, owner.chatID, wrappedMessage, ctx.message.sticker.file_id);
    } else {
        ctx.reply("Something went wrong, please try again.");
    }   
}

// Sends a header followed by a sticker
const sendSticker = async (ctx: Context, chatID: number, message: string, sticker: string) => {
    const response = await ctx.api.sendMessage(chatID, message, {
        parse_mode: "MarkdownV2",
    });
    ctx.api.sendSticker(chatID, sticker);
}