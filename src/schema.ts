

interface AppUser {
    nameOnMsg: string,
    UUID: number,
    chatID: number,
    channelsOwned: string[],
    channelsModded: string[],
    channelsSender: string[],
    activeChannel: string,
    isBanned: boolean
};

interface Channel {
    UUID: string,
    owner: number,
    mods: number[],
    senders: number[],
    senderAlias: Map<string, number>, // for the record, this is mapping a string (alias), to a number (user's uuid as assigned by telegram)
    senderAliasReverse: Map<number, string>, // for the record, this is mapping a number (user's uuid as assigned by telegram), to a string (alias)
    joinLink: string
};

export {AppUser, Channel}