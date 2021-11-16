import { v4 as uuidv4 } from 'uuid';
import { AppUser, Channel } from './schema';
import data from './wordList.json';

// Generates a UUID from the UUID package
function getUUID(): string {
    return uuidv4();
}

// Returns the index of the user that has the UUID specified
function getUser(UUID: number, userList: AppUser[]): number {
    console.log(JSON.stringify(userList));
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

export { getUUID, getUser, getIDfromSender, 
         getChannel, getChannelFromJoin, 
         getUserFromMessage, isUserMessage, 
         getOwnerNameFromChannel, userHasChannel, 
         generateAlias };
         