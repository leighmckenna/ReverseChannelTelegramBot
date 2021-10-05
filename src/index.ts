import { Context, Telegraf } from 'telegraf';
import { AppUser, Channel } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { token } from './config';

const bot = new Telegraf(token);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

//populate new user
bot.start((ctx) => {
    userList.push(<AppUser> {
        UUID: ctx.from.id,
        nameOnMsg: ctx.from.first_name,
        chatOwned: [] as string[],
        chatModed: [] as string[],
        chatSender: [] as string[],
        banned: false
    })
});

//create a new channel
bot.command('newchannel', (ctx) => {
    chanList.push(
        <Channel> {
            UUID: getUUID(),
            owner: ctx.from.id,
            ops: [] as number[],
            senders: [] as number[],
            senderAlias: new Map<string, number>(),
            joinLink: ctx.from.first_name
        }
    );
});



// start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

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

function getUser(UUID: number): AppUser {
    return <AppUser> userList.find( AppUser => AppUser.UUID === UUID);
}

function getChannel(UUID: string): Channel {
    return <Channel> chanList.find( Channel => Channel.UUID === UUID);
}
