const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientIdlive, guildIdlive, tokenlive } = require('./config.json');
const { EmbedBuilder } = require('discord.js');


const commands = [
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),

	new SlashCommandBuilder().setName('addplayer')
		.setDescription('Adds player to database')
		.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.').setRequired(true)),

	new SlashCommandBuilder().setName('assignreporttochar')
		.setDescription('Gives a you own unassigned report to one of your characters.')
		.addStringOption(option => option.setName('reportname').setDescription('Enter the unassigned report name which you own.').setRequired(true))
		.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true)),


		new SlashCommandBuilder().setName('newchar')
		.setDescription('Adds a new character to a player.')
		.addUserOption(option => option.setName('mention').setDescription('Player discord @mention').setRequired(true))
		.addStringOption(option => option.setName('character').setDescription('Name of the new character, captials matter').setMinLength(1).setMaxLength(30).setRequired(true))
		.addNumberOption(option => option.setName('startlevel').setDescription('Number of character slots').setRequired(true).addChoices(
			{ name: '1', value: 1 },
			{ name: '2', value: 2 })),


	new SlashCommandBuilder().setName('changeslots')
		.setDescription('Set a players character slot limit to the given value.')
		.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.').setRequired(true))
		.addNumberOption(option => option.setName('slots').setDescription('Number of character slots.').setMinValue(0).setMaxValue(666).setRequired(true)),

	new SlashCommandBuilder().setName('changestatus')
		.setDescription('Changes status of character(s). use character name to change a single char or player to change all.')
		.addStringOption(option => option.setName('status').setDescription('The status you wish to change to.').setRequired(true).addChoices(
			{ name: 'Awaiting Creation Approval', value: 'Awaiting Creation Approval.' },
			{ name: 'Awaiting Approval', value: 'Awaiting Approval.' },
			{ name: 'Approved', value: 'Approved' },
			{ name: 'Unavailable for Sessions', value: 'Unavailable for Sessions' },
			{ name: 'Awaiting Audit or Revision', value: 'Awaiting Audit or Revision' },
			{ name: 'M.I.A.', value: 'M.I.A.' },
			{ name: 'Retired', value: 'Retired' },
			{ name: 'Shadowrealm (Banned)', value: 'Shadowrealm (Banned)' }))
		.addStringOption(option => option.setName('character').setDescription('Character name, case sensitive'))
		.addStringOption(option => option.setName('mention').setDescription('Player discord @mention, use for changing the status on characters of a player.')),

	new SlashCommandBuilder().setName('renamecharacter')
		.setDescription('Renames a character which you own.')
		.addStringOption(option => option.setName('oldname').setDescription('Current Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true))
		.addStringOption(option => option.setName('newname').setDescription('New Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true)),


	new SlashCommandBuilder().setName('addxp')
		.setDescription('Adds/Subtracts XP to a character, it is not counted in the player xp total.')
		.addStringOption(option => option.setName('character').setDescription('Character Name.').setMinLength(1).setMaxLength(30).setRequired(true))
		.addNumberOption(option => option.setName('xp').setDescription('The amount of XP to change.').setMinValue(-1000).setMaxValue(1000).setRequired(true)),

	new SlashCommandBuilder().setName('recalculatecharacter')
		.setDescription('Forces a recalculation of a characters reports.')
		.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true)),

	new SlashCommandBuilder().setName('newsessionreport')
		.setDescription('Creates a new report with the given name, name must be unique and a mention of the GM is required.')
		.addStringOption(option => option.setName('reportname').setDescription('Report name, must be unique, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true))
		.addStringOption(option => option.setName('gm').setDescription('Player discord @mention.').setRequired(true)),

	new SlashCommandBuilder().setName('publishsessionreport')
		.setDescription('Publishes a report, making it uneditable and hands out the rewards to the listed characters and GMs.')
		.addStringOption(option => option.setName('reportname').setDescription('Report name, must be unpublished, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true)),

	new SlashCommandBuilder().setName('changereportdescription')
		.setDescription('Changes a report\'s description, must be unpublished.')
		.addStringOption(option => option.setName('reportname').setDescription('Report name, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true))
		.addStringOption(option => option.setName('reportdescription').setDescription('New report description, must be under 3000 characters.').setMinLength(1).setMaxLength(3000).setRequired(true)),

	new SlashCommandBuilder().setName('addchartosr')
		.setDescription('Adds characters to an unpublished report, up to 8 at a time. All are case sensitive.')
		.addStringOption(option => option.setName('reportname').setDescription('Exact report name you wish to add the characters to, must be unpublished.').setMinLength(1).setMaxLength(60).setRequired(true))
		.addStringOption(option => option.setName('character-1').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-2').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-3').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-4').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-5').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-6').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-7').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30))
		.addStringOption(option => option.setName('character-8').setDescription('Exact name of the character you wish to add to the report.').setMinLength(1).setMaxLength(30)),

		new SlashCommandBuilder().setName('addgmstosr')
		.setDescription('Adds gms to an unpublished report, up to 8 at a time.')
		.addStringOption(option => option.setName('reportname').setDescription('Exact report name you wish to add the characters to, must be unpublished.').setMinLength(1).setMaxLength(60).setRequired(true))
		.addUserOption(option => option.setName('gm-1').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-2').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-3').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-4').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-5').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-6').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-7').setDescription('Mention of the GM you wish to add to the report.'))
		.addUserOption(option => option.setName('gm-8').setDescription('Mention of the GM you wish to add to the report.')),

	new SlashCommandBuilder().setName('purchase')
		.setDescription('Purchases or sells an item on a character you own. Give a negative value to sell an item.')
		.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive').setMinLength(1).setMaxLength(30).setRequired(true))
		.addStringOption(option => option.setName('item').setDescription('Name of item(s) purchased or sold.').setMinLength(1).setMaxLength(80).setRequired(true))
		.addNumberOption(option => option.setName('gp').setDescription('Gold spent/gained').setMinValue(-3000).setMaxValue(3000).setRequired(true)),

	new SlashCommandBuilder().setName('addapproval')
		.setDescription('Adds an entry to the a character\'s approval log. Staff Only.')
		.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive').setMinLength(1).setMaxLength(30).setRequired(true))
		.addStringOption(option => option.setName('approval').setDescription('approval entry to add.').setMinLength(1).setMaxLength(120).setRequired(true)),

	new SlashCommandBuilder().setName('updateallcharactersforcards')
		.setDescription('Test Command.'),

	new SlashCommandBuilder().setName('characterdetails')
		.setDescription('Changes details of a character that are not required and are considered fluff.')
		.addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true))
		.addStringOption(option => option.setName('class').setDescription('Class of the character.').addChoices(
			{ name: 'Alchemist', value: 'Alchemist' },
			{ name: 'Barbarian', value: 'Barbarian' },
			{ name: 'Bard', value: 'Bard' },
			{ name: 'Champion', value: 'Champion' },
			{ name: 'Cleric', value: 'Cleric' },
			{ name: 'Druid', value: 'Druid' },
			{ name: 'Fighter', value: 'Fighter' },
			{ name :'Gunslinger', value: 'Gunslinger' },
			{ name: 'Inventor', value: 'Inventor' },
			{ name: 'Investigator', value: 'Investigator' },
			{ name: 'Magus', value: 'Magus' },
			{ name: 'Monk ', value: 'Monk' },
			{ name: 'Oracle', value: 'Oracle' },
			{ name: 'Psychic', value: 'Psychic' },
			{ name: 'Ranger', value: 'Ranger' },
			{ name: 'Rogue', value: 'Rogue' },
			{ name: 'Sorcerer', value: 'Sorcerer' },
			{ name: 'Summoner', value: 'Summoner' },
			{ name: 'Swashbuckler', value: 'Swashbuckler' },
			{ name: 'Thaumaturge', value: 'Thaumaturge' },
			{ name: 'Witch', value: 'Witch' },
			{ name: 'Wizard', value: 'Wizard' },
		))
		.addStringOption(option => option.setName('type').setDescription('Type of the character.').addChoices(
			{ name: 'Striker', value: 'Striker' },
			{ name: 'Artillery ', value: 'Artillery ' },
			{ name: 'Support', value: 'Support' },
			{ name: 'Controller', value: 'Controller' }))
		.addStringOption(option => option.setName('description').setDescription('A little fluffy description for your character no longer than a tweet.').setMinLength(1).setMaxLength(240))
		.addStringOption(option => option.setName('image').setDescription('An image to represent your character, give a discord image url').setMaxLength(300))
		.addBooleanOption(option => option.setName('allow').setDescription('Permission to your character details in Card game hosted on the bot')),

	new SlashCommandBuilder().setName('updateallplayersforcards')
		.setDescription('Test Command.'),

		new SlashCommandBuilder().setName('tradecards')
		.setDescription('Trade one card for another with another player.')
		.addUserOption(option => option.setName('mention').setDescription('Mention of the player you wish to trade with.').setRequired(true))
		.addStringOption(option => option.setName('offer').setDescription('The Card Tag of the card you wish to give').setMinLength(5).setRequired(true))
		.addStringOption(option => option.setName('want').setDescription('The Card Tag of the card you wish to recieve').setMinLength(5).setRequired(true)),

		new SlashCommandBuilder().setName('giftcard')
		.setDescription('Gift one card to another player')
		.addUserOption(option => option.setName('mention').setDescription('Mention of the player you wish to trade with.').setRequired(true))
		.addStringOption(option => option.setName('giftcard').setDescription('The Card Tag of the card you wish to gift').setMinLength(5).setRequired(true)),

		new SlashCommandBuilder().setName('recyclecards')
		.setDescription('Gives info on a card.')
		.addStringOption(option => option.setName('recyclecard').setDescription('The Card Tag of the card you wish to recycle.').setMinLength(5).setRequired(true))
		.addNumberOption(option => option.setName('quantity').setDescription('The quantity of cards you wish to recycle.').setRequired(true)),

		new SlashCommandBuilder().setName('addrp')
		.setDescription('Gives Recycple Points to Everyone.')
		.addNumberOption(option => option.setName('amount').setDescription('The amount of XP to change').setMinValue(0).setMaxValue(100).setRequired(true))
		.addUserOption(option => option.setName('mention').setDescription('A specific person to award RP')),

	new SlashCommandBuilder().setName('createcardset')
		.setDescription('Admin ONLY.'),

	new SlashCommandBuilder().setName('sortcards')
		.setDescription('Sorts your Card Collection.')
		.addStringOption(option => option.setName('type').setRequired(true).setDescription('How you wish to sort your collection.').addChoices(
			{ name: 'Qty, Top to Bottom', value: 'QTtoB' },
			{ name: 'Qty, Bottom to Top', value: 'QBtoT' },
			{ name: 'By Card Tag', value: 'tag' },
			{ name: 'By Character Name', value: 'CharName' },
		)),

	new SlashCommandBuilder().setName('pullcard')
		.setDescription('Gives one card. Usable once per day or if you have 10 Recycle Points. Daily is used before points.'),


]
	.map(command => command.toJSON());


const commandsglobal = [
	new SlashCommandBuilder().setName('oraclehelp')
		.setDescription('Gives information on Oracle of Abadar Commands, select "all" for generic overview.')
		.addStringOption(option => option.setName('command').setDescription('Name of command you want information on.').setRequired(false).addChoices(
			{ name: 'all', value: 'all' },
			{ name: 'addplayer', value: 'addplayer' },
			{ name: 'infoplayer', value: 'infoplayer' },
			{ name: 'infochar', value: 'infochar' },
			{ name: 'inforeport', value: 'inforeport' },
			{ name: 'purchase ', value: 'purchase' },
			{ name: 'changeslots', value: 'changeslots' },
			{ name: 'changestatus', value: 'changestatus' },
			{ name: 'changereportdescription', value: 'changereportdescription' },
			{ name: 'addapproval', value: 'addapproval' },
			{ name: 'newchar', value: 'newchar' },
			{ name: 'addxp', value: 'addxp' },
			{ name: 'recalculatecharacter', value: 'recalculatecharacter' },
			{ name: 'newsessionreport', value: 'newsessionreport' },
			{ name: 'addchartosr', value: 'addchartosr' },
			{ name: 'assignreporttochar', value: 'assignreporttochar' },
			{ name: 'publishsessionreport', value: 'publishsessionreport' },
			{ name: 'renamecharacter', value: 'renamecharacter' },
		)),

	new SlashCommandBuilder().setName('infolevels')
		.setDescription('Gives information on the level speard of characters.'),

	new SlashCommandBuilder().setName('infoplayer')
		.setDescription('Gives info on a existing player.')
		.addUserOption(option => option.setName('mention').setDescription('Player discord @mention')),

	new SlashCommandBuilder().setName('infocharacter')
		.setDescription('Gives information on a given character of a player')
		.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true)),

	new SlashCommandBuilder().setName('inforeport')
		.setDescription('gives information on a given report.')
		.addStringOption(option => option.setName('reportname').setDescription('Report name, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true)),

	new SlashCommandBuilder().setName('lastplayed')
		.setDescription('See how many games each player played in the last X days.')
		.addNumberOption(option => option.setName('days').setDescription('How many days from today should be checked?').setMinValue(1).setMaxValue(100))
		.addStringOption(option => option.setName('sort').setDescription('How you wish to sort your played or ran games.').addChoices(
			{ name: 'Games Played', value: 'played' },
			{ name: 'Games Ran', value: 'ran' },
			{ name: 'Combined', value: 'combined' },
		)),

	new SlashCommandBuilder().setName('infocard')
		.setDescription('Gives info on a card.')
		.addStringOption(option => option.setName('card').setDescription('Card Tag').setMinLength(5).setRequired(true)),


].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(tokenlive);

rest.put(Routes.applicationGuildCommands(clientIdlive, guildIdlive), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

rest.put(
	Routes.applicationCommands(clientIdlive),
	{ body: commandsglobal },
).then(() => console.log('Successfully global registered application commands.'))
;
