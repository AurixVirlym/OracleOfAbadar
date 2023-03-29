const { REST, Routes } = require('discord.js');
const { clientIdlive, guildIdlive, tokenlive } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const globalcommands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const globalcommandFiles = fs.readdirSync('./globalcommands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

for (const file of globalcommandFiles) {
	const command = require(`./globalcommands/${file}`);
	globalcommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(tokenlive);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientIdlive, guildIdlive),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${globalcommands.length} global (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientIdlive),
			{ body: globalcommands },
		);

		console.log(`Successfully reloaded ${data.length} global (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

