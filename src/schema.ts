

interface AppUser {
    nameOnMsg: string,
    UUID: number,
    chatOwned: string[],
    chatModed: string[],
    chatSender: string[],
    chatTarget: string,
    currentAction: string,
    banned: boolean
};

interface Channel {
    UUID: string,
    owner: number,
    ops: number[],
    senders: number[],
// for the record, this is mapping a string (alias), to a number (user's uuid as assigned by telegram)
    senderAlias: Map<string, number>, 
    joinLink: string
};

export {AppUser, Channel}