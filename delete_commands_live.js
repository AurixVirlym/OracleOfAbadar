const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientIdlive, guildIdlive, tokenlive } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(tokenlive);

// ...

// for guild-based commands
rest.put(Routes.applicationGuildCommands(clientIdlive, guildIdlive), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(clientIdlive), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);
