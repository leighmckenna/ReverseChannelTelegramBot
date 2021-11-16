import { Context } from 'grammy';
import { AppUser, Channel } from './schema';
import { getUser, getIDfromSender,
         getUserFromMessage, isUserMessage } 
         from './utility';

function sendBroadcast(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[]) {
    if (ctx.message){
        for (let senderID of channel.senders) {
            let user = userList[getUser(senderID, userList)];
            if (ctx.message.text) {
                let username = owner.nameOnMsg;
                let wrappedMessage = "<" + username + "> " + ctx.message.text;
                ctx.api.sendMessage(user.chatID, wrappedMessage);
            }
        }
    } else {
        ctx.reply("Something went wrong. Please try again.");
    }
}

function replyToSender(ctx: Context, owner: AppUser, channel: Channel, userList: AppUser[], chanList: Channel[]) {
    if (ctx.message && ctx.message.reply_to_message && ctx.from ){
        if (ctx.message.reply_to_message.text && isUserMessage(ctx.message.reply_to_message.text)) {
            let sender = getUserFromMessage(ctx.message.reply_to_message.text);
            if (sender) {
                let senderID = getIDfromSender(sender, userList[getUser(ctx.from.id, userList)].activeChannel, chanList);
                if (senderID) {
                    console.log("Sender is " + sender + " with ID " + senderID)
                    let user = userList[getUser(senderID, userList)];
                    let owner = userList[getUser(channel.owner, userList)];
                    let username = owner.nameOnMsg;
                    let wrappedMessage = "_<" + username + "\\>_ " + ctx.message.text;
                    ctx.api.sendMessage(user.chatID, wrappedMessage, {
                        parse_mode: "MarkdownV2",
                    });
                }
            }
        // owner is trying to reply to the bot
        } else if (ctx.message.text) {
            ctx.reply("I'm sorry, messages cannot be broadcast as replies.");
        }
    }
}

function sendToOwner(ctx: Context, sender: AppUser, channel: Channel, userList: AppUser[]) {
    let owner = userList[getUser(channel.owner, userList)];
    if (ctx.message && ctx.message.text && ctx.from) {
        if (process.env.NODE_ENV == 'dev'){
            console.log(JSON.stringify(channel));
        }
        let alias = channel.senderAliasReverse.get(sender.UUID);
        let wrappedMessage = "<" + alias + "> " + ctx.message.text;
        ctx.api.sendMessage(owner.chatID, wrappedMessage, {
            parse_mode: "MarkdownV2",
        });
    } else {
        ctx.reply("Something went wrong, please try again.");
    }   
}

export { sendBroadcast, replyToSender, sendToOwner };
