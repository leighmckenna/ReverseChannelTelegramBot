"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var telegraf_1 = require("telegraf");
var bot = new telegraf_1.Telegraf(process.env["BOT_TOKEN"]);
// Enable graceful stop
process.once('SIGINT', function () { return bot.stop('SIGINT'); });
process.once('SIGTERM', function () { return bot.stop('SIGTERM'); });
