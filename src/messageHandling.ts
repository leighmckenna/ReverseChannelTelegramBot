import { Context } from 'grammy';
import { AppUser, Channel } from './schema';
import { getUUID, getUser, getIDfromSender, 
         getChannel, getChannelFromJoin, 
         getUserFromMessage, isUserMessage, 
         getOwnerNameFromChannel, userHasChannel, 
         generateAlias } 
         from './utility';

// Determines who a message is being sent to and from, then sends message accordingly using provided function pointers
function sendMessage(ctx: Context, replyToSender: Function, sendBroadcast: Function, 
                     sendToOwner: Function, userList: AppUser[], chanList: Channel[]) 
{
    if (ctx.from && ctx.message && getUser(ctx.from.id, userList) > -1) {
        // if user is in a channel
        if(userList[getUser(ctx.from.id, userList)].activeChannel){

            let user = userList[getUser(ctx.from.id, userList)];
            let channel = chanList[getChannel(user.activeChannel, chanList)];
            
            // check if user owns channel
            if (channel.owner == ctx.from.id){
                // user owns channel
                // check if message is a broadcast or reply
                if (ctx.message.reply_to_message){
                    // message is a reply
                    if (ctx.message.reply_to_message.sticker) {
                        ctx.reply("Error: Cannot reply to a sticker. Reply to the header above it instead.")
                    } else {
                        replyToSender(ctx, user, channel, userList, chanList);
                    }
                } else {
                    // message is a broadcast
                    console.log("Sending message");
                    sendBroadcast(ctx, user, channel, userList);
                }
            } else if (channel.senders.includes(ctx.from.id)){
                // user does not own channel
                // send message to channel owner
                console.log("Sending message");
                sendToOwner(ctx, user, channel, userList);

            // user is not in a channel
            } else {
                ctx.reply("You have no selected channel. Please select a channel with /messagechannel.");
            }
        }
    }
}

// Send a text message from the owner of a channel to all members of the channel
function sendBroadcastText(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[]) {
    console.log("sending broadcast")
    console.log(JSON.stringify(userList));
    if (ctx.message){
        // send to every member of a channel
        for (let senderID of channel.senders) {
            let user = userList[getUser(senderID, userList)];
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
function replyToSenderText(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[], chanList: Channel[]) {
    if (ctx.message && ctx.message.reply_to_message && ctx.from ){
        if (ctx.message.reply_to_message.text && isUserMessage(ctx.message.reply_to_message.text)) {
            // owner is replying to a user message
            let sender = getUserFromMessage(ctx.message.reply_to_message.text);
            if (sender) {
                let senderID = getIDfromSender(sender, userList[getUser(ctx.from.id, userList)].activeChannel, chanList);
                if (senderID) {
                    console.log("Sender is " + sender + " with ID " + senderID)
                    let user = userList[getUser(senderID, userList)];
                    let owner = userList[getUser(channel.owner, userList)];
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
function sendToOwnerText(ctx: Context, sender: AppUser, channel: Channel, userList: AppUser[]) {
    console.log("sending to owner");
    console.log(JSON.stringify(userList));
    let owner = userList[getUser(channel.owner, userList)];
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
function sendBroadcastSticker(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[]) {
    if (ctx.message && ctx.message.sticker){
        for (let senderID of channel.senders) {
            let user = userList[getUser(senderID, userList)];
            let username = owner.nameOnMsg;
            let wrappedMessage = "\<" + username + "\\>: ";
            sendSticker(ctx, user.chatID, wrappedMessage, ctx.message.sticker.file_id);
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

// Send a sticker message from the owner of a channel to a specific user as a reply
function replyToSenderSticker(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[], chanList: Channel[]) {
    if (ctx.message && ctx.message.reply_to_message && 
        ctx.from && ctx.message.sticker){
        if (ctx.message.reply_to_message.text && isUserMessage(ctx.message.reply_to_message.text)) {
            // owner is replying to a user message
            let sender = getUserFromMessage(ctx.message.reply_to_message.text);
            if (sender) {
                let senderID = getIDfromSender(sender, owner.activeChannel, chanList);
                if (senderID) {
                    let user = userList[getUser(senderID, userList)];
                    let owner = userList[getUser(channel.owner, userList)];
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
function sendToOwnerSticker(ctx: Context, sender: AppUser, channel: Channel, userList: AppUser[]) {
    let owner = userList[getUser(channel.owner, userList)];
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

export { sendMessage, sendBroadcastText, replyToSenderText, 
         sendToOwnerText, sendBroadcastSticker, 
         replyToSenderSticker, sendToOwnerSticker };
