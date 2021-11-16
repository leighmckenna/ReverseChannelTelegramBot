import { v4 as uuidv4 } from 'uuid';
import { AppUser, Channel } from './schema';
import data from './wordList.json';
import { Api, Bot, Context, InlineKeyboard } from 'grammy';

// Generates a UUID from the UUID package
function getUUID(): string {
    return uuidv4();
}

// Returns the index of the user that has the UUID specified
function getUser(UUID: number, userList: AppUser[]): number {
    return userList.findIndex(AppUser => AppUser.UUID === UUID);
}

// Returns the telegram user ID of a sender based on their alias
function getIDfromSender(user: string, channelID: string, chanList: Channel[]): number | undefined {
    if (chanList[getChannel(channelID, chanList)].senderAlias.get(user)) {
        return chanList[getChannel(channelID, chanList)].senderAlias.get(user);
    }
    return undefined;
}

// Returns the index of the channel that has the UUID specified
function getChannel(UUID: string, chanList: Channel[]): number {
    return chanList.findIndex(Channel => Channel.UUID === UUID);
}

// Returns the index of the channel the user is trying to join
function getChannelFromJoin(joinCode: string, chanList: Channel[]): number {
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
function getOwnerNameFromChannel(UUID: string, userList: AppUser[], chanList: Channel[]): string {
    // get the channel
    let channelInd = getChannel(UUID, chanList);
    // get the owner
    let ownerInd = getUser(chanList[channelInd].owner, userList);
    // get the owner's name and return
    return userList[ownerInd].nameOnMsg;
}

// Returns true if the channel exists and else otherwise
function userHasChannel(UUID: number, chanList: Channel[]): boolean {
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

function joinChannel(ctx: Context, userList: AppUser[], chanList: Channel[]) {
    if (ctx.from && ctx.message && ctx.message.text && ctx.match &&
        getUser(ctx.from.id, userList) > -1) {
        console.log("match is" + ctx.match);
        let joinCode: string; //ctx.message.text.substring(13);
        if (typeof ctx.match == "string") {
            joinCode = ctx.match;
        } else {
            joinCode = ctx.match[0];
        }
        
        console.log("join code is" + joinCode);
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

export { getUUID, getUser, getIDfromSender, 
         getChannel, getChannelFromJoin, 
         getUserFromMessage, isUserMessage, 
         getOwnerNameFromChannel, userHasChannel, 
         generateAlias, joinChannel };
         