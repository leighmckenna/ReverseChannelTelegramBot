import { Context, Telegraf } from 'telegraf';
import { AppUser, Channel } from './schema';
import { token } from './config';

const bot = new Telegraf(token);

//define global lists of users and channels
var userList: AppUser[] = [];
var chanList: Channel[] = [];

//populate new user
bot.start((ctx) => {
    userList.push(<AppUser> {
        UID: getUserUID(),
        nameOnMsg: ctx.from.first_name,
        tgUID: ctx.from.id,
        chatOwned: [] as number[],
        chatModed: [] as number[],
        chatSender: [] as number[],
        banned: false
    })
});

//create a new channel
bot.command('newchannel', (ctx) => {
    chanList.push(
        <Channel> {
            UID: getChannelUID(),
            owner: getUserFromTGID(ctx.from.id),
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

//currently makes UID for users, replace with actual UID generation later
function getUserUID(): number {
    return userList.length;
}

//currently makes UID for channels, replace with actual UID generation later
function getChannelUID(): number {
    return chanList.length;
}

function getUserFromTGID(telegramID: number): number {

    return 0;
}

