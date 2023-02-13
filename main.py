import os

import sqlite3

from dotenv import load_dotenv

from telegram import ForceReply, Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

load_dotenv()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    await update.message.reply_html(
        rf"Hi {user.mention_html()}!",
        reply_markup=ForceReply(selective=True),
    )


async def send_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /send is issued."""
    await update.message.reply_text("Send!")


def init_db() -> sqlite3.Connection:
    # connect to the db & create cursor
    db = sqlite3.connect('rcbot.db')
    cursor = db.cursor()
    # create the db if none exists
    tables = cursor.execute("SELECT * FROM sqlite_master WHERE type='table'").fetchall()
    if tables.__len__() == 0:
        # create tables
        cursor.execute()
        db.commit()
    cursor.close()
    return db


def main() -> None:
    db = init_db()

    # Instanciate the bot
    bot = Application.builder().token(os.environ['APIKey']).build()
    bot.add_handler(CommandHandler("start", start))

    bot.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, send_message))

    # Remain in the loop until someone kills the process
    bot.run_polling()


if __name__ == "__main__":
    main()
