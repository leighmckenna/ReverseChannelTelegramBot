# Reverse Channel Telegram Bot
___
## Purpose
This bot runs in a nodejs docker container and serves as a proxy that allows users to message a recipient anonymously while allowing for third party moderation.
## Use
To set this up, edit config.ts and assign the following variables, then run `docker build -t [your username]/tg-reverse-bot .`
* ```token``` - your token from @BotFather

This bot runs based on telegram webhooks, please make sure you are running it from a location with a static ip or at least a DDNS setup. If you are in need of one, I have made one for porkbun [here](https://github.com/leighmckenna/RaspberryPiCICD).
