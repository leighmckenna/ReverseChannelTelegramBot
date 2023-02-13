import logging

import telegrampy
from telegrampy.ext import commands

import os
print(os.environ['HOME'])

logging.basicConfig(level=logging.INFO, format="(%(asctime)s) %(levelname)s %(message)s", datefmt="%m/%d/%y - %H:%M:%S %Z")
logger = logging.getLogger("telegrampy")

bot = commands.Bot("token here")

@bot.command()
async def hi(ctx):
    await ctx.send("Hello")

bot.run()