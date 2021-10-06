
enum Tasks {
    Admin,
    Message
};

interface AppUser {
    nameOnMsg: string,
    UUID: number,
    chatOwned: string[],
    chatModed: string[],
    chatSender: string[],
    chatTarget: string,
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

interface UserStatus{
    task: Tasks,
    focusedChannel: number,
};

export {AppUser, Channel}