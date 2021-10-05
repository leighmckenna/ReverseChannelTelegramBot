
enum Tasks {
    Admin,
    Message
};

interface AppUser {
    UID: number,
    nameOnMsg: string,
    tgUID: number,
    chatOwned: number[],
    chatModed: number[],
    chatSender: number[],
    banned: boolean
};

interface Channel {
    UID: number,
    owner: number,
    ops: number[],
    senders: number[],
    senderAlias: Map<string, number>,
    joinLink: string
};

interface UserStatus{
    task: Tasks,
    focusedChannel: number,
};

export {AppUser, Channel}