import { Context, Telegraf } from 'telegraf'
import { AppUser, Channel } from './schema';
import { token } from './config'

const bot = new Telegraf(token)




// start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))