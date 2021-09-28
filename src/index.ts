import { Context, Telegraf } from 'telegraf'
import { token } from './config'

const bot = new Telegraf(token)


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))