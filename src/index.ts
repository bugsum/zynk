import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { resolve } from 'path';

const EnvFile = process.env.NODE_ENV === 'development' ? '.dev.env' : '.env';

const EnvFilePath = resolve(process.cwd(), EnvFile);

config({ path: EnvFilePath });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.MessageContent,
    ],
});

client.login(process.env.TOKEN);

client.on(Events.ClientReady, (client) => {
    console.log('Logged in as: ' + client.user.username);
});

client.on(Events.Debug, (message) => {
    console.log(message);
});

client.on(Events.MessageCreate, async (message) => {
    const prefix = '?';

    if (
        !message.guild ||
        message.author.bot ||
        !message.content.startsWith(prefix)
    )
        return;

    if (message.content.includes('ping')) {
        message.reply('Here is my ping: ' + client.ws.ping);
    }
});
