const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientId, guildId, token } = require('./config.json');
const { EmbedBuilder } = require('discord.js');





const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),

    new SlashCommandBuilder().setName('addplayer')
	.setDescription('Adds player to database')
	.addStringOption(option => option.setName('addplayerinput').setDescription('Enter a name').setRequired(true)),
	

	new SlashCommandBuilder().setName('infoplayer')
	.setDescription('Gives info on a existing player.')
	.addStringOption(option => option.setName('infoplayerinput').setDescription('Enter a name')),


	new SlashCommandBuilder().setName('assignreporttochar')
	.setDescription('Gives a you own unassigned report to one of your characters.')
	.addStringOption(option => option.setName('reportname').setDescription('Enter the unassigned report name which you own.').setRequired(true))
	.addStringOption(option => option.setName('charnameinput').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true)),


	new SlashCommandBuilder().setName('newchar')
	.setDescription('Adds a new character to a player.')
	.addStringOption(option => option.setName('mentioninput').setDescription('Player discord @mention').setRequired(true))
	.addStringOption(option => option.setName('charinput').setDescription('Name of the new character').setMinLength(1).setMaxLength(30).setRequired(true))
	.addNumberOption(option => option.setName('startlevel').setDescription('Number of character slots').setRequired(true).addChoices(
		{ name: 'First', value: 1 },
		{ name: 'Second', value: 2 },)),


	new SlashCommandBuilder().setName('changeslots')
	.setDescription('Set a players character slot limit to the given value.')
	.addStringOption(option => option.setName('mentioninput').setDescription('Player discord @mention').setRequired(true))
	.addNumberOption(option => option.setName('slots').setDescription('Number of character slots').setMinValue(0).setMaxValue(666).setRequired(true)),
	
	new SlashCommandBuilder().setName('changestatus')
	.setDescription('Changes status of character(s). use character name to change a single char or player to change all.')
	.addStringOption(option => option.setName('status').setDescription('Character Name').setRequired(true).addChoices(
		{ name: 'Awaiting Creation Approval', value: 'Awaiting Creation Approval.' },
		{ name: 'Awaiting Approval', value: 'Awaiting Approval.' },
		{ name: 'Approved', value: 'Approved' },
		{ name: 'Unavailable for Sessions', value: 'Unavailable for Sessions' },
		{ name: 'Awaiting Audit or Revision', value: 'Awaiting Audit or Revision' },
		{ name: 'M.I.A.', value: 'M.I.A.' },
		{ name: 'Retired', value: 'Retired' },
		{ name: 'Shadowrealm (Banned)', value: 'Shadowrealm (Banned)' },))
	.addStringOption(option => option.setName('character').setDescription('Character Name'))
	.addStringOption(option => option.setName('mention').setDescription('Player discord @mention, use for changing the status on characters of a player.')),

	new SlashCommandBuilder().setName('infochar')
	.setDescription('Gives information on a given character of a player')
	.addStringOption(option => option.setName('infocharinput').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true)),
	
	new SlashCommandBuilder().setName('inforeport')
	.setDescription('gives information on a given report.')
	.addStringOption(option => option.setName('reportname').setDescription('Report name, must be unpublished').setMinLength(1).setMaxLength(60).setRequired(true)),

	new SlashCommandBuilder().setName('newsessionreport')
	.setDescription('Creates a new report with the given name, name must be unique and a mention of the GM is required.')
	.addStringOption(option => option.setName('reportname').setDescription('Report name, must be unique').setMinLength(1).setMaxLength(60).setRequired(true))
	.addStringOption(option => option.setName('gm').setDescription('Player discord @mention').setRequired(true)),

	new SlashCommandBuilder().setName('publishsessionreport')
	.setDescription('Publishes a report, making it uneditable and hands out the rewards to the listed characters and GMs.')
	.addStringOption(option => option.setName('reportname').setDescription('Report name, must be unpublished').setMinLength(1).setMaxLength(60).setRequired(true)),

	new SlashCommandBuilder().setName('addchartosr')
	.setDescription('Adds characters to an unpublished report, up to 8 at a time.')
	.addStringOption(option => option.setName('reportname').setDescription('Exact report name you wish to add the characters to, must be unpublished.').setMinLength(1).setMaxLength(60).setRequired(true))
	.addStringOption(option => option.setName('character-1').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-2').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-3').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-4').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-5').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-6').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-7').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
	.addStringOption(option => option.setName('character-8').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30)),
	
	new SlashCommandBuilder().setName('purchase')
	.setDescription('Purcahes or sells an item on a character you own. Give a negative value to sell an item.')
	.addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true))
	.addStringOption(option => option.setName('item').setDescription('Name of item(s) purchased or sold.').setMinLength(1).setMaxLength(80).setRequired(true))
	.addNumberOption(option => option.setName('gp').setDescription('Gold spent/gained').setMinValue(-3000).setMaxValue(3000).setRequired(true)),
	
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
