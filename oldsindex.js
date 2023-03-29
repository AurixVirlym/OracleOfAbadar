
const mongoose = require('mongoose');
const { Client, GatewayIntentBits } = require('discord.js');
const { token, databasetoken } = require('./config.json');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ComponentType } = require('discord.js');
const { bold } = require('discord.js');
const isImageURL = require('image-url-validator').default;

const GoldAtLevel = [0, 20, 40, 80, 140, 260, 460, 749, 1140, 1640, 2340];
const GoldPerXP = [0, 5, 10, 15, 30, 50, 70, 100, 125, 175, 225];
const RoleBotAdmin = 'Bot Admin';
const RoleStaff = 'Staff';
const RolePlayerGM = 'Player GM';
const CollecterTimeout = 600000;
const PlayerEmbedColor = '1ABC9C';
const CharacterEmbedColor = 'BC1A3A';
const ConfirmEmbedColor = 'F1C40F';
const ReportEmbedColor = '9B59B6';

// Create a new client instance
client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	mongoose.connect(
		databasetoken ||
    {
    	keepAlive: true,
    },
	);
	console.log('Connected to MongoDB and the Oracle is alive.');
});


const ConfirmRow = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('yes')
			.setLabel('Yes')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId('no')
			.setLabel('No')
			.setStyle(ButtonStyle.Danger));


const CardSchema = new mongoose.Schema({
	CardPool: Array,
	CardPoolSize: Number,
	Name: String,
	Icon: String,
	Tag: String,
	Created: Date,
	Active: Boolean,
	Specials: Array,
}, { collection: 'Cards' });


const PlayerSchema = new mongoose.Schema({
	DiscordId: { type: String, required: true },
	Characters: Array, // for holding Name string and database id to link. Key ID /Value name
	UnassignedReports: Array, // for holding unassigned GMXP. Key ID /Value Name
	Status: String,
	TotalXP: Number, // for calcing every single point of assigned xp to characters. Could be useful for doing slot unlocked
	CharacterXP: Number,
	ReportXP: Number,
	GMXP: Number,
	UntotalXP: Number,
	CharacterSlots: Number, // for max allowed characters
	CardCollection: Array,
	LastPull: Date,
	RecycledPoints: Number,
	CardRating: Number,
	CardNumber: Number,


}, { collection: 'Players' });

const ReportSchema = new mongoose.Schema({
	Name: { type: String, required: true }, // add check for unique names only
	RunDate: Date, // ?
	XP: Number, // default 250 but add option
	Description: { type: String, required: true }, // think news and net
	GMs: Array, // anyone who gets unassigned xp.
	Characters: Array, // id.
	SSR: Boolean,
	Published: { type: Boolean, required: true }, // to determine if the Report should in players hands.
}, { collection: 'Reports' });


const CharacterSchema = new mongoose.Schema({
	Name: { type: String, required: true },
	BelongsTo: { type: String, required: true }, // database id
	Created: Date, // why not?
	Level: Number,
	StartingLevel: Number,
	CurrentXP: Number,
	TotalXP: Number,
	ManualXP: Number,
	SpentGold: Number,
	MaxGold: Number,
	Status: { type: String, required: true }, // basically options for holding info if a character is retired, active so on.
	PurchaseLog: Array,
	ApprovalLog: Array,
	AssignedReports: Array, // used to figure out so reports are given to the character.
	CardClass: String,
	CardDescription: String,
	CardImage: String,
	CardType: String,
	CardAllowed: Boolean,

}, { collection: 'Characters' });


const CardData = mongoose.model('Cards', CardSchema);
const PlayerData = mongoose.model('Players', PlayerSchema);
const CharacterData = mongoose.model('Characters', CharacterSchema);
const ReportData = mongoose.model('Reports', ReportSchema);

function RandomRange(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function CalcGoldFromXP(QueryCharInfo) {

	return GoldAtLevel[QueryCharInfo.Level] + (Math.floor(QueryCharInfo.CurrentXP / 250) * GoldPerXP[QueryCharInfo.Level]);

}

function EuroDateFunc(ToFormatDate) {
	let date, month, year;

	date = ToFormatDate.getUTCDate();
	month = ToFormatDate.getUTCMonth() + 1;
	year = ToFormatDate.getUTCFullYear();

	date = date
		.toString()
		.padStart(2, '0');

	month = month
		.toString()
		.padStart(2, '0');

	return `${date}/${month}/${year}`;
}


function GenCardEmbed(Card, CardSet) {
	if (Card.Special === true) {
		CardEmbedColour = 0xF1C40F;
		var CardTitle = bold(':star:' + Card.Name + ' - ' + CardSet.Tag + Card.CID);
	}
	else {
		switch (Card.Rarity) {
		case 'Untrained':
			CardEmbedColour = 'a2decc';
			break;

		case 'Trained':
			CardEmbedColour = '1abc9c';
			break;

		case 'Expert':
			CardEmbedColour = '217965';
			break;

		case 'Master':
			CardEmbedColour = '193d33';
			break;

		case 'Legendary':
			CardEmbedColour = '000000';
			break;

		default:
			CardEmbedColour = 'aaa9ad';
			break;
		}
		var CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
	}


	CardEmbed = new EmbedBuilder()
		.setColor(CardEmbedColour)
		.setTitle(CardTitle)
		.setImage(Card.Image)
		.addFields(
			{ name: 'Tier', value: Card.Rarity, inline: true },
			{ name: 'Level', value: String(Card.Level), inline: true },
			{ name: 'Class', value: Card.Class, inline: true },
			{ name: 'Type', value: Card.Type, inline: true },
		)
		.setDescription(Card.Description)
		.setThumbnail(CardSet.Icon)
		.setTimestamp()
		.setFooter({ text: CardSet.Name + ' - ALC Trading Card Game' });

	return CardEmbed;

}


async function RecalcCharacter(CharToRecalc, interaction) {
	StringToReply = String(CharToRecalc);
	try {
		QueryCharInfo = await CharacterData.findOne({ Name: CharToRecalc });
	}
	catch (error) {
		await interaction.reply({ content: 'Did not find the character ***' + CharToRecalc + '***.' });
		return;
	}

	if (QueryCharInfo !== null) {
		let ReportsSucceeded = 0;
		ReportsToCheck = QueryCharInfo.AssignedReports;
		QueryCharInfo.Level = QueryCharInfo.StartingLevel;
		QueryCharInfo.CurrentXP = QueryCharInfo.ManualXP;
		QueryCharInfo.TotalXP = QueryCharInfo.ManualXP;
		QueryCharInfo.MaxGold = GoldAtLevel[QueryCharInfo.StartingLevel];

		for (const iterator of ReportsToCheck) {


			QueryReportinfo = await ReportData.findOne({ _id: iterator });


			if (QueryReportinfo !== null && typeof QueryReportinfo !== undefined) {
				QueryCharInfo.CurrentXP += QueryReportinfo.XP;
				QueryCharInfo.TotalXP += QueryReportinfo.XP;
				ReportsSucceeded += 1;

			}
			else {await interaction.reply({ content: 'Did not find the character ***' + CharToRecalc + '***.' });}

		}

		StringToReply = 'Recalculated ' + ReportsSucceeded + '/' + ReportsToCheck.length + ' for ***' + QueryCharInfo.Name + '***.';

		while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
			QueryCharInfo.CurrentXP -= 1000;
			QueryCharInfo.Level += 1;
		}


		QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

		StringToReply += '\n***' + QueryCharInfo.Name + '*** is level ' + QueryCharInfo.Level + ' with a max gold of ' + QueryCharInfo.MaxGold + '.';
		await QueryCharInfo.save();
		await interaction.reply({ content: StringToReply });
	}


}

async function CharsAddToReport(CharsToAddArray, ReportToQuery, interaction) {
	let StringToReply = 'Character(s) added:\n';
	const QueryReportInfo = await ReportData.findOne({ Name: ReportToQuery });
	CharsConfirmedArray = [];
	if (QueryReportInfo !== null && CharsToAddArray !== undefined) {

		if (QueryReportInfo.SSR === true) {
			await interaction.reply({ content: 'Report is an SSR.', embeds: [], components: [] });
			return;
		}

		if (QueryReportInfo.Published === false) {

			CharsToAddArray = CharsToAddArray.filter(function(el) {
				return el != null;
			});


			if (CharsToAddArray !== null) {


				for (const Element of CharsToAddArray) {
					SameCheckID = false;
					QueryCharInfo = await CharacterData.findOne({ Name: Element });

					if (QueryCharInfo !== null && typeof QueryCharInfo !== undefined) {
						SameCheck = await QueryReportInfo.Characters.includes(QueryCharInfo._id);

						if (SameCheck == false) {
							StringToReply += QueryCharInfo.Name + ' to ' + QueryReportInfo.Name + '.\n';
							QueryReportInfo.Characters.push(QueryCharInfo._id);

						}
						else {(StringToReply += QueryCharInfo.Name + ' already is in ' + QueryReportInfo.Name + '.\n');}

					}
					else {(StringToReply += 'Character ' + Element + ' does not exist.\n');}
				}

				await QueryReportInfo.save();

				// console.log(CharsConfirmedArray)
				// QueryReportInfo.Characters = QueryReportInfo.Characters.concat(CharsConfirmedArray)

			}
			else {StringToReply = 'No characters found.';}
		}
		else {StringToReply = 'Report already published.';}
	}
	else {StringToReply = 'Report not found.';}
	await interaction.update({ content: StringToReply, embeds: [], components: [] });

}

async function GMsAddToReport(GMsToAddArray, ReportToQuery, interaction) {
	let StringToReply = 'GM(s) added:\n';
	const QueryReportInfo = await ReportData.findOne({ Name: ReportToQuery });
	CharsConfirmedArray = [];
	if (QueryReportInfo !== null && GMsToAddArray !== undefined) {

		if (QueryReportInfo.SSR === true) {
			await interaction.reply({ content: 'Report is an SSR.', embeds: [], components: [] });
			return;
		}

		if (QueryReportInfo.Published === false) {

			GMsToAddArray = GMsToAddArray.filter(function(el) {
				return el != null;
			});


			if (GMsToAddArray !== null) {


				for (const Element of GMsToAddArray) {
					SameCheckID = false;
					QueryGMInfo = await PlayerData.findOne({ DiscordId: Element });

					if (QueryGMInfo !== null && typeof QueryGMInfo !== undefined) {
						SameCheck = await QueryReportInfo.GMs.includes(QueryGMInfo._id);

						if (SameCheck == false) {
							StringToReply += QueryGMInfo.DiscordId + ' to ' + QueryReportInfo.Name + '.\n';
							QueryReportInfo.GMs.push(QueryGMInfo._id);

						}
						else {(StringToReply += QueryGMInfo.DiscordId + ' already is in ' + QueryReportInfo.Name + '.\n');}

					}
					else {(StringToReply += 'GM: ' + Element + ' does not exist.\n');}
				}

				await QueryReportInfo.save();

				// console.log(CharsConfirmedArray)
				// QueryReportInfo.Characters = QueryReportInfo.Characters.concat(CharsConfirmedArray)

			}
			else {StringToReply = 'No player found.';}
		}
		else {StringToReply = 'Report already published.';}
	}
	else {StringToReply = 'Report not found.';}
	await interaction.update({ content: StringToReply, embeds: [], components: [] });

}


async function PublishSR(QueryReportInfo, interaction) {

	let ProcessSuccess = 0;
	let StringToReply = '';
	if (QueryReportInfo !== null) {
		if (QueryReportInfo.Published === false) {

			CharsToReward = QueryReportInfo.Characters;


			if (QueryReportInfo.GMs !== null) {
				for (const Element of QueryReportInfo.GMs) {
					const QueryPlayerInfo = await PlayerData.findOne({ _id: Element });
					if (QueryPlayerInfo !== null) {

						QueryPlayerInfo.RecycledPoints += 15;
						QueryPlayerInfo.UnassignedReports.push(QueryReportInfo._id);

						QueryPlayerInfo.ReportXP += QueryReportInfo.XP;

						StringToReply += '\nGave report ***"' + QueryReportInfo.Name + '"*** to ' + QueryPlayerInfo.DiscordId + ' as an unassigned report and 15 recycle points.';


						if (QueryReportInfo.SSR === false) {
							QueryPlayerInfo.GMXP += Math.round(QueryReportInfo.XP * 0.5);
						}

						await QueryPlayerInfo.save();
						ProcessSuccess += 1;

					}
					else {
						StringToReply += '\nDatabase ID' + Element + 'not found.';

					}

				}

			}
			else {
				await interaction.reply({ content: 'No GM found on Report.' });
				return;
			}


			if (CharsToReward !== null) {
				for (const Element of CharsToReward) {
					{
						const QueryCharInfo = await CharacterData.findOne({ _id: Element });
						if (QueryCharInfo !== null) {
							QueryCharInfo.AssignedReports.push(QueryReportInfo._id);
							QueryCharInfo.CurrentXP += QueryReportInfo.XP;
							QueryCharInfo.TotalXP += QueryReportInfo.XP;

							StringToReply += '\n' + QueryCharInfo.BelongsTo + ' ***' + QueryCharInfo.Name + '*** gained ' + QueryReportInfo.XP + ' XP!';

							while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
								QueryCharInfo.CurrentXP -= 1000;
								QueryCharInfo.Level += 1;
								StringToReply += '\n***' + QueryCharInfo.Name + '*** gained enough XP to gain level ' + QueryCharInfo.Level + '!';
							}

							QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

							await QueryCharInfo.save();
						}
						else {
							StringToReply += '\n***"' + Element + '*** not found in database.';
						}
					}
				}
				QueryReportInfo.Published = true;
				await QueryReportInfo.save();
				StringToReply += '\n***' + QueryReportInfo.Name + '*** has been published.';

			}
			else {StringToReply = 'No characters in Report: ' + QueryReportInfo.Name + '.';}
		}
		else {StringToReply = 'Report ' + QueryReportInfo.Name + ' already published.';}

	}
	else {StringToReply = 'Report ' + QueryReportInfo.Name + ' not found.';}

	if (StringToReply.length >= 2000) {
		StringToReply = StringToReply.slice(0, 1984) + '\nMessageTooLong';
	}

	if (QueryReportInfo.SSR === true) {
		StringToReply = 'SSR Published and given out to ' + ProcessSuccess + '/' + QueryReportInfo.GMs.length + ' players.';
	}


	await interaction.update({ content: StringToReply, embeds: [], components: [] });

}


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	switch (commandName) {
	case 'ping':
		await interaction.reply({ content: 'Pong!', ephemeral: true });
		break;


	case 'server':
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
		break;


	case 'oraclehelp':

		let CommandHelp = interaction.options.getString('command');
		let HelpToSend = 'God help you, you caused an error.';

		if (CommandHelp === null) {CommandHelp = 'all';}

		switch (CommandHelp) {
		case 'all':
			HelpToSend =
            '***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self.'
            + '\n***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative.'
            + '\n***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative.'
            + '\n***/purchase*** - Adds entires to a character\'s purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative.'
            + '\n***/recalculatecharacter*** - Recalculates a character\'s XP and Gold. Use character name, case sensative.'
            + '\n***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both.'
            + '\n***/renamecharacter*** - Updates the name of your character to a new one, case sensative.'
            + '\n***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative.'
            + '\n***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game.'
            + '\n***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive.'
            + '\n***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative.'
            + '\n***/addplayer*** - **Staff Command** - Adds a person to the oracle\'s database via discord @mentions'
            + '\n***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions'
            + '\n***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions'
            + '\n***/addapproval*** - **Staff Command** - Adds entires to a character\'s approval log. Use character name, case sensative.'
            + '\n***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions,character name is case sensative, needs to be unique.'
            + '\n***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player\'s total XP.';

			break;
		case 'addplayer':
			HelpToSend = '***/addplayer*** - **Staff Command** - Adds a person to the oracle\'s database via discord @mentions';
			break;
		case 'infoplayer':
			HelpToSend = '***/infoplayer*** - Displays information on players registered on the oracle. Use Discord @mentions. Leave blank to info self.';
			break;
		case 'infochar':
			HelpToSend = '***/infochar*** - Displays information on a character registered on the oracle. Use character name, case sensative.';
			break;
		case 'inforeport':
			HelpToSend = '***/inforeport*** - Displays read information on a session report registered on the oracle. Use SR name, case sensative.';
			break;
		case 'purchase':
			HelpToSend = '***/purchase*** - Adds entires to a character\'s purchase log. Use postive gp to buy, negative gp to sell items. Use character name, case sensative.';
			break;
		case 'changeslots':
			HelpToSend = '***/changeslots*** - **Staff Command** - Updates the amount of characters a player may have. Use Discord @mentions';
			break;
		case 'changestatus':
			HelpToSend = '***/changestatus*** - **Staff Command** - Updates the status of a character. Use Discord @mentions';
			break;
		case 'changereportdescription':
			HelpToSend = '***/changereportdescription*** - **GM Command** - Updates a SR description. Use SR name, case sensative.';
			break;
		case 'addapproval':
			HelpToSend = '***/addapproval*** - **Staff Command** - Adds entires to a character\'s approval log. Use character name, case sensative.';
			break;
		case 'newchar':
			HelpToSend = '***/newchar*** - **Staff Command** - Creates a new character for a player on the oracle. Use Discord @mentions, character name is case sensative, needs to be unique with 30 letter limit.';
			break;
		case 'addxp':
			HelpToSend = '***/addxp*** - **Staff Command** - Adds or subtracts XP to character which does not count towards a player\'s total XP.';
			break;
		case 'recalculatecharacter':
			HelpToSend = '***/recalculatecharacter*** - Recalculates a character\'s XP and Gold. Use character name, case sensative.';
			break;
		case 'newsessionreport':
			HelpToSend = '***/newsessionreport*** - **GM Command** - Creates a new session report, SR name is case sensative and need to be unique. GM is the person who ran the game.';
			break;
		case 'addchartosr':
			HelpToSend = '***/addchartosr*** - **GM Command** - Adds up to 8 characters (at a time) to an unpublished SR. Use character(s) name, case sensative, SR also case sensastive.';
			break;
		case 'assignreporttochar':
			HelpToSend = '***/assignreporttochar*** - Assigns a Unassigned Report (GMXP) to a character. Use character name and SR name, case sensative for both.';
			break;
		case 'publishsessionreport':
			HelpToSend = '***/publishsessionreport*** - **GM Command** - Publishes an unpublished SR, giving out the rewards to the players and GM. Use SR name, case sensative.';
			break;
		case 'renamecharacter':
			HelpToSend = '***/renamecharacter*** - Updates the name of your character to a new one, case sensative. 30 letter limit.';
			break;
		}

		const HelpEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(bold(CommandHelp))
			.setDescription(HelpToSend)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [HelpEmbed], ephemeral: true });

		break;

	case 'addplayer':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var PlayerDiscordMention = interaction.options.getUser('mention');
		var PlayerDiscordID = PlayerDiscordMention.id
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'

		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.Reply({ content: 'No such player in database or other error.' });
			break;
		}


		if (typeof PlayerName != undefined) {
			var SameCheck = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}

		var ErrorSend = 'Failed to add player:' + '  -  ' + PlayerDiscordMention;

		try {
			var PlayerDiscordUsername = PlayerName.username;
		}
		catch (err) {

			await interaction.reply({ content: 'Invalid Name' });
			break;
		}


		if (typeof PlayerDiscordUsername != undefined && typeof PlayerName != undefined && SameCheck == null) {
			item = {
				DiscordId: PlayerDiscordMention,
				Status: 'Active',
				Characters: [], // for holding Name string and database id to link
				UnassignedReports: [], // for holding unassigned GMXP
				TotalXP: 0, // for calcing every single point of assigned xp to characters. Could be useful for doing slot unlocked
				CharacterXP: 0,
				ReportXP: 0,
				GMXP: 0,
				UntotalXP: 0,
				CharacterSlots: 1, // for max allowed characters
				CardCollection: [],
				CardNumber: 0,
				CardRating: 0,
				LastPull: new Date(),
				RecycledPoints: 30,

			};

			var data = new PlayerData(item);
			data.save();

			await interaction.reply({ content: 'Added ' + PlayerDiscordMention + ' Welcome to ALC.' });
		}
		else if (SameCheck != null) {
			ErrorSend += 'Player already exists';
			await interaction.reply({ content: ErrorSend });
		}
		else if (typeof PlayerDiscordUsername != undefined) {
			await interaction.reply({ content: ErrorSend });

		}
		break;


	case 'infoplayer':

		await interaction.deferReply();

		var PlayerDiscordMention = interaction.options.getUser('mention');

		if (PlayerDiscordMention == null) {
			var PlayerDiscordID = interaction.user.id;
			var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		}

		else {
			var PlayerDiscordID = PlayerDiscordMention.id
			var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
		}


		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.editReply({ content: 'No such player in database or other error.' });
			break;
		}


		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}
		var CharInfoSting = '';
		if (QueryPlayerInfo != null) {


			const AllOwnedCharsNumber = QueryPlayerInfo.Characters.length;
			QueryPlayerInfo.TotalXP = 0;
			QueryPlayerInfo.UntotalXP = 0;
			QueryPlayerInfo.CharacterXP = 0;
			CharInfo = [];
			CharInfoSting = '';
			MaxIndexLength = AllOwnedCharsNumber;
			for (i = 0; i < AllOwnedCharsNumber; i++) {
				CharPulled = await CharacterData.findById(QueryPlayerInfo.Characters[i]);
				if (CharPulled != null) {

					CharInfo.push('\n' + CharPulled.Status + ' - ' + `${CharPulled.Name}`
            + ' - Level: ' + CharPulled.Level
            + ' - XP: ' + CharPulled.CurrentXP + '/1000'
            + ' - Gold: ' + (CharPulled.MaxGold - CharPulled.SpentGold.toFixed(2)).toFixed(2) + '/' + CharPulled.MaxGold);

					QueryPlayerInfo.UntotalXP += CharPulled.ManualXP;
					QueryPlayerInfo.CharacterXP += CharPulled.TotalXP;

				}
				else {CharInfo.push('\nBroken Character Link');}
			}

			QueryPlayerInfo.TotalXP = (QueryPlayerInfo.CharacterXP + QueryPlayerInfo.ReportXP + QueryPlayerInfo.GMXP - QueryPlayerInfo.UntotalXP);
			await QueryPlayerInfo.save();

			StringToEmbed = CharInfo.slice(0, 10).toString().replace(/,/g, '');

			const PlayerInfoSting = bold(
				'Total XP: ' + QueryPlayerInfo.TotalXP
        + ' - Character Slots: ' + QueryPlayerInfo.CharacterSlots
        + '\nCharacter XP: ' + QueryPlayerInfo.CharacterXP
        + ' - Report XP: ' + QueryPlayerInfo.ReportXP
        + ' - GM XP: ' + QueryPlayerInfo.GMXP,
			);


			// unassigned Report Info
			UnassignedReportInfo = [];
			NumberOfReportsToPull = QueryPlayerInfo.UnassignedReports.length;
			for (let index = 0; index < NumberOfReportsToPull; index++) {

				const IDtofind = QueryPlayerInfo.UnassignedReports[index];

				QueryReportInfo = await ReportData.findOne({ _id: IDtofind });
				if (QueryReportInfo !== null) {
					UnassignedReportInfo.push('\n' + String(QueryReportInfo.Name) + ' - XP: ' + QueryReportInfo.XP);
				}
				else {
					UnassignedReportInfo.push('\n***ERR*** - Failed To Find Report: ' + QueryPlayerInfo.UnassignedReports[index]);
				}

			}

			CardCollectionInfo = [];
			CardCollectionString = '';
			NumberOfCardsToProcess = QueryPlayerInfo.CardCollection.length;
			for (let index = 0; index < NumberOfCardsToProcess; index++) {

				const CardtoProcess = QueryPlayerInfo.CardCollection[index];
				if (CardtoProcess !== null && CardtoProcess !== undefined) {
					CardCollectionInfo.push('\n***' + CardtoProcess.CardTag + '*** -  ' + CardtoProcess.CardName + ' - Qty: ' + String(CardtoProcess.quantity));
				}
				else {
					CardCollectionInfo.push('\n***ERR*** - Failed To Find Card: ' + QueryPlayerInfo.CardCollection[index]);
				}

			}


			// player info embed
			const InfoPlayerCharEmbed = new EmbedBuilder()
				.setColor(PlayerEmbedColor)
				.setTitle(bold(PlayerName.username))
				.setDescription(PlayerInfoSting + StringToEmbed)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });


			const rowchar = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('backId')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('forwardId')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('reportdesc')
						.setLabel('Unassigned Reports')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('cardlist')
						.setLabel('Card Collection')
						.setStyle(ButtonStyle.Primary),
				);

			const rowreport = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('backId')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('forwardId')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('charlist')
						.setLabel('Character List')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('cardlist')
						.setLabel('Card Collection')
						.setStyle(ButtonStyle.Primary),
				);

			embedMessage = await interaction.editReply({ embeds: [InfoPlayerCharEmbed], components: [rowchar] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let currentIndex = 0;
			let currentPage = 'charlist';

			collector.on('collect', async interaction => {
				if (interaction.customId === 'charlist') {
					currentIndex = 0;
					MaxIndexLength = CharInfo.length;
					currentPage = interaction.customId;
					rowtodisplay = rowchar;
					StringToEmbed = '\nCharacters: ' + CharInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
				}


				if (interaction.customId === 'reportdesc') {
					currentIndex = 0;
					MaxIndexLength = UnassignedReportInfo.length;
					currentPage = interaction.customId;
					rowtodisplay = rowreport;
					StringToEmbed = '\n**Unassigned Reports:** ' + UnassignedReportInfo.slice(currentIndex, currentIndex + 10).toString();
				}

				if (interaction.customId === 'cardlist') {
					currentIndex = 0;
					MaxIndexLength = CardCollectionInfo.length;
					currentPage = interaction.customId;
					StringToEmbed =
        '\n**Number of Cards: ' + QueryPlayerInfo.CardNumber + ' - ' + 'Card Rating: ' + QueryPlayerInfo.CardRating + '**' +
        '\n**Recycle Points: ' + QueryPlayerInfo.RecycledPoints + '**' +
        '\n\n**Card Collection:** ' + CardCollectionInfo.slice(currentIndex, currentIndex + 20).toString().replace(/,/g, '');
				}

				{

					// Increase/decrease index
					if (currentPage == 'cardlist') {

						if (interaction.customId === 'forwardId' && currentIndex + 20 - MaxIndexLength < 0) {
							currentIndex += 20;
						}
						else if (currentIndex - 20 >= 0 && interaction.customId === 'backId') {currentIndex -= 20;}

					}
					else

					if (interaction.customId === 'forwardId' && currentIndex + 10 - MaxIndexLength < 0) {
						currentIndex += 10;
					}
					else if (currentIndex - 10 >= 0 && interaction.customId === 'backId') {currentIndex -= 10;}


					if (interaction.customId === 'fowardId' || 'backID') {
						switch (currentPage) {
						case 'charlist':
							StringToEmbed = '\nCharacters: ' + CharInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
							rowtodisplay = rowchar;
							break;


						case 'reportdesc':
							StringToEmbed = '\n**Unassigned Reports:** ' + UnassignedReportInfo.slice(currentIndex, currentIndex + 10).toString();
							rowtodisplay = rowreport;
							break;

						case 'cardlist':
							StringToEmbed =
        '\n**Number of Cards: ' + QueryPlayerInfo.CardNumber + ' - ' + 'Card Rating: ' + QueryPlayerInfo.CardRating + '**' +
        '\n**Recycle Points: ' + QueryPlayerInfo.RecycledPoints + '**' +
        '\n\n**Card Collection:** ' + CardCollectionInfo.slice(currentIndex, currentIndex + 20).toString().replace(/,/g, '');
							rowtodisplay = rowreport;
							break;
						}
					}


					// Respond to interaction by updating message with new embed
					await interaction.update({
						embeds: [new EmbedBuilder()
							.setColor(PlayerEmbedColor)
							.setTitle(bold(PlayerName.username))
							.setDescription(PlayerInfoSting + StringToEmbed)
							.setTimestamp()
							.setFooter({ text: 'Absalom Living Campaign' }),
						],

						components: [rowtodisplay],
					});


				}
			});

		}
		else {
			await interaction.reply({ content: 'No such player in database or other error.' });
		}


		break;


	case 'newchar':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}


		var PlayerDiscordMention = interaction.options.getUser('mention');
		var StartingLevel = interaction.options.getNumber('startlevel');
		var CharacterName = interaction.options.getString('character');


		if (CharacterName == null || PlayerDiscordMention == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (CharacterName.length >= 30) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		var PlayerDiscordID = PlayerDiscordMention.id
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
		

		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.Reply({ content: 'No such player in database or other error.' });
			break;
		}

		var	CharacterName =	CharacterName.replace(/[\\@#&!`*_~<>|]/g, '');

		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			var QueryCharacterInfo = await CharacterData.findOne({ Name: CharacterName });
		}
		else {
			await interaction.reply({ content: 'Incorrect Player Mention' });
			break;
		}

		if (QueryPlayerInfo != null && QueryCharacterInfo == null) {

			if (QueryPlayerInfo.Characters.length < QueryPlayerInfo.CharacterSlots) {
				item = {
					Name: CharacterName,
					BelongsTo: PlayerDiscordMention, // database id
					Created: Date(),
					Level: StartingLevel,
					StartingLevel: StartingLevel,
					CurrentXP: 0,
					TotalXP: 0,
					ManualXP: 0,
					SpentGold: 0,
					MaxGold: GoldAtLevel[StartingLevel],
					Status: 'Awaiting Creation Approval', // basically options for holding info if a character is retired, active so on.
					PurchaseLog: [],
					AssignedReports: [],
					CardClass: 'Not Set.',
					CardDescription: 'Not Set.',
					CardImage: 'Not Set.',
					CardType: 'Not Set.',
					CardAllowed: false,
				};

				var data = new CharacterData(item);
				await data.save();

				var QueryCharacterInfo = await CharacterData.findOne({ Name: CharacterName });

				await QueryPlayerInfo.Characters.push(QueryCharacterInfo._id);
				await QueryPlayerInfo.save();

				await interaction.reply({ content: 'Created ' + CharacterName + ' for ' + PlayerDiscordMention });

			}
			else	 {
				await interaction.reply({ content: 'Player may not have more characters.' });
				break;
			}

		}
		else {
			await interaction.reply({ content: 'Database Error, name already taken or player has not been added.' });
			break;
		}
		break;


	case 'changeslots':


		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}


		var NewSlots = interaction.options.getNumber('slots');
		var PlayerDiscordMention = interaction.options.getUser('mention');

		if (PlayerDiscordMention == null || NewSlots == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		if (typeof NewSlots != Number && NewSlots < 0) {
			await interaction.reply({ content: 'Invalid value for slots' });
			break;
		}


		var PlayerDiscordID = PlayerDiscordMention.id
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
		

		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.Reply({ content: 'No such player in database or other error.' });
			break;
		}

		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}
		else {
			await interaction.reply({ content: 'Incorrect Player Mention' });
			break;
		}

		if (QueryPlayerInfo != null) {
			const OldSlots = QueryPlayerInfo.CharacterSlots;
			QueryPlayerInfo.CharacterSlots = NewSlots;
			await QueryPlayerInfo.save();
			await interaction.reply({ content: PlayerDiscordMention + ' now has ' + NewSlots + ' character slots instead of ' + OldSlots + '.' });
		}
		else {interaction.reply({ content: 'Did not find player entry' });}
		break;


	case 'infocharacter':
		var CharName = interaction.options.getString('character');
		if (CharName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}

		await interaction.deferReply();

		if (typeof CharName != undefined) {

			var QueryCharacterInfo = await CharacterData.findOne({ Name: CharName });
		}

		if (QueryCharacterInfo != null) {

			const CalcedGoldSpent = (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold).toFixed(2);
			var CharInfoSting = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\nGold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold
            + '\nStatus: ' + QueryCharacterInfo.Status;


			try {
				PlayerName = await client.users.fetch(QueryCharacterInfo.BelongsTo.replace(/[\\<>@#&!]/g, ''));
				DiscordNameToDisplay = PlayerName.username + '\'s ';
			}
			catch (error) {
				DiscordNameToDisplay = 'ERR - Could not Find Discord Name of Player';
			}
			DiscordNameToDisplay = String(DiscordNameToDisplay);

			AssignedReportInfo = [];
			PurchaseLogInfo = [];
			ApprovalLogInfo = [];
			AssignedReportInfoString = '';
			NumberOfReportsToPull = QueryCharacterInfo.AssignedReports.length;
			NumberOfPurchaseLogs = QueryCharacterInfo.PurchaseLog.length;
			NumberOfApprovalLogs = QueryCharacterInfo.ApprovalLog.length;

			for (let index = 0; index < NumberOfReportsToPull; index++) {

				const IDtofind = QueryCharacterInfo.AssignedReports[index];


				QueryReportInfo = await ReportData.findOne({ _id: IDtofind });

				if (QueryReportInfo !== null) {
					AssignedReportInfo.push('\n' + index + ' - ' + EuroDateFunc(QueryReportInfo.RunDate) + ' - ' + QueryReportInfo.Name + ' - XP: ' + QueryReportInfo.XP);
				}
				else {
					AssignedReportInfo.push('\n***ERR*** - Failed To Find Report: ' + QueryCharacterInfo.AssignedReports[index]);
				}

			}

			for (let index = 0; index < NumberOfPurchaseLogs; index++) {

				const PLog = QueryCharacterInfo.PurchaseLog[index];
				PurchaseLogInfo.push('\n' + index + ' - ' + PLog[0] + ' - ' + PLog[1] + PLog[2] + ' for ' + PLog[3] + ' gp.');


			}

			for (let index = 0; index < NumberOfApprovalLogs; index++) {

				const ApprovalEntry = QueryCharacterInfo.ApprovalLog[index];
				ApprovalLogInfo.push('\n' + index + ' - ' + ApprovalEntry[0] + ' - ' + ApprovalEntry[1] + ApprovalEntry[2] + ' by ' + ApprovalEntry[3] + '/' + ApprovalEntry[4]);


			}

			var URLimage = 'https://cdn.discordapp.com/attachments/1006650762035728424/1055186205752434791/Oracle.webp';
			if (await isImageURL(QueryCharacterInfo.CardImage)) {
				var URLimage = QueryCharacterInfo.CardImage;
			}


			// char info embed
			const InfoCharEmbed = new EmbedBuilder()
				.setColor(CharacterEmbedColor)
				.setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
				.setDescription(CharInfoSting)
				.setTimestamp()
				.addFields(
					{ name: 'Class', value: QueryCharacterInfo.CardClass, inline: true },
					{ name: 'Type', value: QueryCharacterInfo.CardType, inline: true },
					{ name: 'Fluff Description', value: QueryCharacterInfo.CardDescription },
				)
				.setThumbnail(URLimage)
				.setFooter({ text: 'Absalom Living Campaign' });


			const rowindex = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('backId')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('forwardId')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary),
				);

			const rowinfochar = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('characterinfo')
						.setLabel('Overview')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('purchaselog')
						.setLabel('Purchase Logs')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('sessionreports')
						.setLabel('Session Reports')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('approvallog')
						.setLabel('Approval Log')
						.setStyle(ButtonStyle.Primary),

				);


			embedMessage = await interaction.editReply({ embeds: [InfoCharEmbed], components: [rowinfochar] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let MaxIndexLength = 0;
			let currentIndex = 0;
			let currentPage = 'characterinfo';

			collector.on('collect', async interaction => {
				QueryCharacterInfo = await CharacterData.findOne({ Name: CharName });

				if (interaction.customId === 'sessionreports') {
					currentIndex = 0;
					MaxIndexLength = AssignedReportInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\n**Session Reports** ' + AssignedReportInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
				}


				if (interaction.customId === 'purchaselog') {
					currentIndex = 0;
					MaxIndexLength = PurchaseLogInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = '**Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold + '**' +
            '\n**Purchase Log:** ' + PurchaseLogInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
				}

				if (interaction.customId === 'approvallog') {
					currentIndex = 0;
					MaxIndexLength = ApprovalLogInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = '**Approval Log:** ' + ApprovalLogInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
				}

				if (interaction.customId === 'characterinfo') {
					currentIndex = 0;
					MaxIndexLength = 0;
					currentPage = interaction.customId;
					StringToEmbed = '**Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000**'
            + '\n**Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold + '**'
            + '\n**Status: ' + QueryCharacterInfo.Status + '**';
				}

				{

					// Increase/decrease index
					if (interaction.customId === 'forwardId' && currentIndex + 10 - MaxIndexLength < 0) {currentIndex += 10;}
					else if (currentIndex - 10 >= 0 && interaction.customId === 'backId') {currentIndex -= 10;}


					if (interaction.customId === 'fowardId' || 'backID' && interaction.customId !== 'characterinfo') {
						switch (currentPage) {
						case 'purchaselog':
							StringToEmbed = bold('Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold) +
            '\n**Purchase Log:** ' + PurchaseLogInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
							break;

						case 'approvallog':
							StringToEmbed = '**Approval Log:** ' + ApprovalLogInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
							break;

						case 'reportdesc':
							StringToEmbed = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\n**Assigned Reports:**' + AssignedReportInfoString.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
							break;
						}
					}

					if (MaxIndexLength > 10) {

						// Respond to interaction by updating message with new embed
						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
								.setDescription(StringToEmbed)
								.setTimestamp()
								.setFooter({ text: 'Absalom Living Campaign' }),
							],

							components: [rowinfochar, rowindex],
						});
					}
					else if (interaction.customId === 'characterinfo') {

						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
								.setDescription(CharInfoSting)
								.setTimestamp()
								.addFields(
									{ name: 'Class', value: QueryCharacterInfo.CardClass, inline: true },
									{ name: 'Type', value: QueryCharacterInfo.CardType, inline: true },
									{ name: 'Fluff Description', value: QueryCharacterInfo.CardDescription },
								)
								.setThumbnail(URLimage)
								.setFooter({ text: 'Absalom Living Campaign' }),
							], components: [rowinfochar],
						});

					}
					else {

						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold(DiscordNameToDisplay + QueryCharacterInfo.Name))
								.setDescription(StringToEmbed)
								.setTimestamp()
								.setFooter({ text: 'Absalom Living Campaign' }),
							],

							components: [rowinfochar],


						});
					}

				}
			});
		}
		else {
			await interaction.editReply({ content: 'No such character in database or other error.' });
		}
		break;


	case 'newsessionreport':


		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		var StringToReply = 'ERR';
		var GMstoReport = [];
		var MakeSSR = false;
		var PlayerDiscordMention = interaction.options.getString('gm');
		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null || PlayerDiscordMention == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}

		PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');
		var PlayerDiscordID = PlayerDiscordMention.replace(/[\\<>@#&!]/g, '');


		EmbedString = 'Do you wish to make the SR "**' + ReportName + '**" - ran by "**' + PlayerDiscordMention + '**"?';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				if (PlayerDiscordMention === '@everyone') {

					if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {

						MakeSSR = true;
						StringToReply = 'Special Session Report ***"' + ReportName + '"*** has been created';
						await PlayerData.find({ Status: 'Active' }).then((PlayerDatas) => {
							PlayerDatas.forEach((PlayerData) => {
								GMstoReport.push(PlayerData._id);

							});
						});

					}
					else {
						interaction.update({ content: 'You lack the role(s) to make a SSR report.', embeds: [], components: [] });
						break;
					}

				}
				else {

					try {
						var PlayerName = await client.users.fetch(PlayerDiscordID);
					}
					catch (error) {
						await interaction.update({ content: 'Incorrect Player Mention', embeds: [], components: [] });

						break;
					}


					if (typeof PlayerName != undefined) {
						var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					}
					else {
						await interaction.update({ content: 'Incorrect Player Mention', embeds: [], components: [] });
						break;
					}

					if (QueryPlayerInfo === null) {
						await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: [] });
						break;
					}
					GMstoReport = QueryPlayerInfo._id;
					StringToReply = 'Report for ***"' + ReportName + '"*** has been created, ran by ' + PlayerName.username;
				}


				var QueryReportInfo = await ReportData.findOne({ Name: ReportName });
				if (QueryReportInfo === null) {

					item = {
						Name: ReportName,
						RunDate: Date(), // ?
						XP: 250, // default 250 but add option
						Description: 'The Description has not been updated.',
						GMs: GMstoReport, // anyone who gets unassigned xp.
						Characters: [], // id.
						SSR: MakeSSR,
						Published: false, // to determine if the Report should in players hands.
					};

					const data = new ReportData(item);
					await data.save();
					await interaction.update({ content: StringToReply, embeds: [], components: [] });
				}
				else {await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: [] });}

				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});


		break;


	case 'addchartosr':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var CharsFromMessage = [
			interaction.options.getString('character-1'),
			interaction.options.getString('character-2'),
			interaction.options.getString('character-3'),
			interaction.options.getString('character-4'),
			interaction.options.getString('character-5'),
			interaction.options.getString('character-6'),
			interaction.options.getString('character-7'),
			interaction.options.getString('character-8'),
		];


		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}

		if (CharsFromMessage.every(element => element === null)) {
			await interaction.reply({ content: 'No characters given.' });
			break;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');


		EmbedString = 'Do you wish to add the following characters to SR "**' + ReportName + '**"?\n' + CharsFromMessage;

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				CharsAddToReport(CharsFromMessage, ReportName, interaction);
				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});


		break;


	case 'publishsessionreport':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		await interaction.deferReply();

		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			break;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');


		EmbedString = 'Do you wish to publish the SR "**' + ReportName + '**"?';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });

		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':

				var QueryReportInfo = await ReportData.findOne({ Name: ReportName });

				if (QueryReportInfo !== null) {


					if (QueryReportInfo.SSR === true) {
						if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
						else {
							interaction.update({ content: 'You lack the role(s) to modify this SSR.', embeds: [], components: [] });
							collector.stop();
							break;

						}
					}

					PublishSR(QueryReportInfo, interaction);
					collector.stop();


				}
				else {await interaction.update({ content: 'Report ' + ReportName + ' not found.', embeds: [], components: [] });}


				collector.stop();
				break;

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});

		break;

	case 'changereportdescription':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		var ReportName = interaction.options.getString('reportname');
		var DescriptionForReport = interaction.options.getString('reportdescription');

		if (ReportName == null || DescriptionForReport == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Report name is too long.' });
			break;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		var QueryReportInfo = await ReportData.findOne({ Name: ReportName });

		if (QueryReportInfo !== null) {
			if (QueryReportInfo.SSR === true) {
				if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
				else {
					interaction.reply({ content: 'You lack the role(s) to modify this SSR.' });
					break;
				}
			}

			QueryReportInfo.Description = DescriptionForReport;
			await QueryReportInfo.save();
			await interaction.reply({ content: 'Description for report ***' + ReportName + '*** has been updated.' });

		}
		else {await interaction.reply({ content: 'Report ' + ReportName + ' not found.' });}

		break;


	case 'inforeport':

		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		var QueryReportInfo = await ReportData.findOne({ Name: ReportName });

		if (QueryReportInfo !== null) {
			const GMsOnList = [];
			let FirstGMName;

			if (QueryReportInfo.SSR === false) {
				QueryGMData = await PlayerData.findOne({ _id: QueryReportInfo.GMs[0] });

				if (QueryGMData != null) {
					const GMid = QueryGMData.DiscordId.replace(/[\\@#&!`*_~<>|]/g, '');
					const FirstGM = await client.users.fetch(GMid);
					FirstGMName = FirstGM.username;
				}

				for (const iterator of QueryReportInfo.GMs) {
					QueryGMData = await PlayerData.findOne({ _id: iterator });

					if (QueryGMData != null) {
						const GMName = QueryGMData.DiscordId;
						GMsOnList.push(GMName);
					}

				}
			}

			if (typeof FirstGMName != undefined && FirstGMName != null) {
				var SRtitle = QueryReportInfo.Name + ' - Ran by ' + FirstGMName;
			}
			else if (QueryReportInfo.SSR === true) {
				var SRtitle = QueryReportInfo.Name + ' - Special Session Report.';
			}
			else {
				var SRtitle = QueryReportInfo.Name;
			}


			const rowlist = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('backId')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('forwardId')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('reportdesc')
						.setLabel('Report Description')
						.setStyle(ButtonStyle.Primary),
				);

			const rowdesc = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('charlist')
						.setLabel('Character List')
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('gmlist')
						.setLabel('GM List')
						.setStyle(ButtonStyle.Primary),
				);

			const embed = new EmbedBuilder()
				.setColor(ReportEmbedColor)
				.setTitle(SRtitle)
				.setDescription(QueryReportInfo.Description)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.reply({ embeds: [embed], components: [rowdesc] });
			currentPage = 'reportdesc';

			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let currentIndex = 0;
			collector.on('collect', async interaction => {

				if (interaction.customId === 'reportdesc') {
					await interaction.update({ embeds: [embed], components: [rowdesc] });
					currentPage = 'reportdesc';
				}
				else {


					// Increase/decrease index
					if (interaction.customId === 'forwardId' && currentIndex + 10 - QueryReportInfo.Characters.length < 0) {currentIndex += 10;}
					else if (currentIndex - 10 >= 0 && interaction.customId === 'backId') {currentIndex -= 10;}


					if (interaction.customId === 'charlist') {
						currentIndex = 0;
						currentPage = 'charlist';
					}

					if (interaction.customId === 'gmlist') {
						currentIndex = 0;
						currentPage = 'gmlist';
					}

					CharInReportID = QueryReportInfo.Characters.slice(currentIndex, currentIndex + 10);
					CharInReportDisplay = 'Characters: ';

					GMsInReportID = GMsOnList.slice(currentIndex, currentIndex + 10);
					GMsInReportDisplay = 'GMs: ';

					if (currentPage == 'charlist') {
						DescReportDisplay = 'Characters: ';
						for (const element of CharInReportID) {
							const QueryCharacterInfo = await CharacterData.findOne({ _id: element });

							if (QueryCharacterInfo != null) {
								DescReportDisplay += '\n ' + QueryCharacterInfo.Name;
							}
						}
					}
					else

					if (currentPage == 'gmlist') {
						DescReportDisplay = 'GMs: ';
						for (const element of GMsInReportID) {
							DescReportDisplay += '\n ' + String(element);
						}
					}

					// Respond to interaction by updating message with new embed
					await interaction.update({
						embeds: [new EmbedBuilder()
							.setColor(ReportEmbedColor)
							.setTitle(SRtitle)
							.setDescription(DescReportDisplay)
							.setTimestamp()
							.setFooter({ text: 'Absalom Living Campaign' }),
						],

						components: [rowlist],
					});


				}
			});


		}
		break;

	case 'assignreporttochar':


		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var CharName = interaction.options.getString('character');
		var ReportName = interaction.options.getString('reportname');
		var StringToReply = '';

		if (ReportName == null || PlayerDiscordMention == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}

		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');


		EmbedString = 'Do you wish to add the unassigned report "**' + ReportName + '**" to **"' + CharName + '**"?';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				var PlayerName = await client.users.fetch(PlayerDiscordID);


				if (typeof PlayerName != undefined) {
					var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					var QueryReportInfo = await ReportData.findOne({ Name: ReportName });
					var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}

				if (QueryPlayerInfo != null && QueryReportInfo !== null && QueryCharInfo != null) {

					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {
						if (QueryPlayerInfo.UnassignedReports.includes(QueryReportInfo._id) == true) {


							QueryCharInfo.AssignedReports.push(QueryReportInfo._id);
							QueryCharInfo.CurrentXP += QueryReportInfo.XP;
							QueryCharInfo.TotalXP += QueryReportInfo.XP;
							QueryPlayerInfo.ReportXP -= QueryReportInfo.XP;


							StringToReply += '\n***' + QueryCharInfo.Name + '*** gained ' + QueryReportInfo.XP + ' XP!';

							while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
								QueryCharInfo.CurrentXP -= 1000;
								QueryCharInfo.Level += 1;
								StringToReply += '\n***' + QueryCharInfo.Name + '*** gained enough XP to gain level ' + QueryCharInfo.Level + '!';
							}

							QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

							await QueryCharInfo.save();
							const index = QueryPlayerInfo.UnassignedReports.indexOf(QueryReportInfo._id);
							if (index > -1) { // only splice array when item is found
								QueryPlayerInfo.UnassignedReports.splice(index, 1); // 2nd parameter means remove one item only
							}


							await QueryPlayerInfo.save();
							StringToReply += '\n***' + QueryReportInfo.Name + '*** has been given to ***' + QueryCharInfo.Name + '!***';
							await interaction.update({ content: StringToReply, embeds: [], components: [] });


						}
						else {await interaction.update({ content: '***' + QueryReportInfo.Name + '*** session report does not belong to you / you already used it.', embeds: [], components: [] });}
					}
					else {await interaction.update({ content: '***' + QueryCharInfo.Name + '*** character does not belong to you.', embeds: [], components: [] });}
				}
				else {await interaction.update({ content: 'Did not find every database entry.', embeds: [], components: [] });}


				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});


		break;


	case 'purchase':
		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var CharName = interaction.options.getString('character');
		var PurchasedItem = interaction.options.getString('item');
		var PurchasedValue = interaction.options.getNumber('gp');

		var StringToReply = '';

		if (CharName == null || PurchasedItem == null || PurchasedValue == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (PurchasedItem.length >= 80) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		EmbedString = 'Do you wish to buy/sell "**' + PurchasedItem + '**"' + ' for **' + PurchasedValue + ' gp** on "**' + CharName + '**"';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				var PlayerName = await client.users.fetch(PlayerDiscordID);


				if (typeof PlayerName != undefined) {
					var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

				}

				if (QueryPlayerInfo != null && QueryCharInfo != null) {
					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {

						PurchaseDate = new Date();
						PurchaseDate = EuroDateFunc(PurchaseDate);

						if (PurchasedValue >= 0) {
							RemainingGold = (QueryCharInfo.MaxGold - QueryCharInfo.SpentGold).toFixed(2);
							if (PurchasedValue <= RemainingGold) {
								var PurchaseEntry = [PurchaseDate, 'Bought: ', PurchasedItem, PurchasedValue]; // date,sold/bought,item,value.
								QueryCharInfo.PurchaseLog.push(PurchaseEntry);
								QueryCharInfo.SpentGold = (QueryCharInfo.SpentGold + PurchasedValue).toFixed(2);

								await QueryCharInfo.save();
								await interaction.update({ content: 'Added Entry: ' + '"' + PurchaseEntry[0] + ' - ' + PurchaseEntry[1] + PurchaseEntry[2] + ' for ' + PurchaseEntry[3] + ' gp."' + ' to ' + QueryCharInfo.Name + '.', embeds: [], components: [] });

							}
							else {await interaction.update({ content: QueryCharInfo.Name + ' can\'t afford this item.', embeds: [], components: [] });}

						}
						else if (PurchasedValue < 0) {

							if (QueryCharInfo.SpentGold >= PurchasedValue) {
								var PurchaseEntry = [PurchaseDate, 'Sold: ', PurchasedItem, PurchasedValue]; // date,sold/bought,item,value.
								QueryCharInfo.PurchaseLog.push(PurchaseEntry);
								QueryCharInfo.SpentGold = (QueryCharInfo.SpentGold + PurchasedValue).toFixed(2);

								await QueryCharInfo.save();
								await interaction.update({ content: 'Added Entry: ' + '"' + PurchaseEntry[0] + ' - ' + PurchaseEntry[1] + PurchaseEntry[2] + ' for ' + PurchaseEntry[3] + ' gp"' + ' to ' + QueryCharInfo.Name + '.', embeds: [], components: [] });

							}
							else {await interaction.update({ content: QueryCharInfo.Name + ' never spent this much gp.', embeds: [], components: [] });}

						}
						else {
							await interaction.update({ content: 'ERR', embeds: [], components: [] });
						}


					}
					else {
						await interaction.update({ content: 'Character does not belong to you, get your own, stinky.', embeds: [], components: [] });
						break;
					}

				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}
				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});


		break;


	case 'changestatus':


		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}


		var CharName = interaction.options.getString('character');
		var PlayerDiscordMention = interaction.options.getString('mention');
		var NewStatus = interaction.options.getString('status');


		if (typeof PlayerDiscordMention != undefined && PlayerDiscordMention !== null) {
			PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
			StringToReply = '';
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			if (QueryPlayerInfo !== null) {
				for (const CharacterID of QueryPlayerInfo.Characters) {
					var QueryCharInfo = await CharacterData.findOne({ _id: CharacterID });

					if (QueryCharInfo !== null) {
						const OldStatus = QueryCharInfo.Status;
						QueryCharInfo.Status = NewStatus;
						await QueryCharInfo.save();

						StringToReply += '\nSet "' + QueryCharInfo.Name + '" to ***' + NewStatus + '*** from ***' + OldStatus + '***.';

					}
					else {
						StringToReply += '\nDid not find the character "' + CharacterID + '" in the database.';
					}
				}
			}
			else {
				interaction.reply({ content: 'Did not find player: ' + PlayerDiscordMention });
				break;
			}
			interaction.reply({ content: StringToReply });
			break;

		}
		else if (typeof CharName != undefined) {
			var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

		}
		else {
			await interaction.reply({ content: 'Did not find a character name.' });
			break;
		}

		if (QueryCharInfo != null) {
			const OldStatus = QueryCharInfo.Status;
			QueryCharInfo.Status = NewStatus;
			await QueryCharInfo.save();

			await interaction.reply({ content: 'Set "' + CharName + '" to ***' + NewStatus + '*** from ***' + OldStatus + '***.' });

			break;
		}
		else {
			await interaction.reply({ content: 'Did not find the character.' });
		}
		break;


	case 'returnallplayers':
		var AllPlayers = [];
		await PlayerData.find({ Characters:{ $exists: true, $not: { $size: 0 } }, Status: 'Active' }).then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				AllPlayers.push(PlayerData.DiscordId);

			});
		});


		break;

	case 'addapproval':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var CharName = interaction.options.getString('character');
		var ApprovalLine = interaction.options.getString('approval');


		var StringToReply = '';

		if (CharName == null || ApprovalLine == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ApprovalLine.length > 120) {
			await interaction.reply({ content: 'Approval length too long.' });
			break;
		}


		EmbedString = 'Do you wish to approve of "**' + ApprovalLine + '**" for "**' + CharName + '**"?';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':
				var PlayerName = await client.users.fetch(PlayerDiscordID);


				if (typeof PlayerName != undefined) {
					var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

				}

				if (QueryCharInfo != null) {


					ApprovalDate = new Date();
					ApprovalDate = EuroDateFunc(ApprovalDate);

					RemainingGold = (QueryCharInfo.MaxGold - QueryCharInfo.SpentGold).toFixed(2);

					const ApprovalEntry = [ApprovalDate, 'Approval: ', ApprovalLine, PlayerName.username, PlayerDiscordMention]; // date,item approved,player approving, Discord ID of approver
					QueryCharInfo.ApprovalLog.push(ApprovalEntry);


					await QueryCharInfo.save();
					await interaction.update({ content: 'Added Entry: ' + '"' + ApprovalEntry[0] + ' - ' + ApprovalEntry[1] + ApprovalEntry[2] + ' by ' + ApprovalEntry[3] + '/' + ApprovalEntry[4] + '"', embeds: [], components: [] });


				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}


				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});


		break;


	case 'addxp':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var CharName = interaction.options.getString('character');
		var XPtoAdd = Math.round(interaction.options.getNumber('xp'));

		var StringToReply = '';

		if (CharName == null || XPtoAdd == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (CharName.length >= 31) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		if (typeof CharName != undefined) {

			var QueryCharInfo = await CharacterData.findOne({ Name: CharName });

		}

		if (QueryCharInfo != null) {
			QueryCharInfo.ManualXP += XPtoAdd;
			await QueryCharInfo.save();
			RecalcCharacter(CharName, interaction);
		}
		else {
			await interaction.reply({ content: 'Did not find the character.' });
		}


		break;


	case 'recalculatecharacter':

		var CharName = interaction.options.getString('character');

		var StringToReply = '';

		if (CharName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (CharName.length >= 31) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		if (typeof CharName != undefined) {

			RecalcCharacter(CharName, interaction);
		}
		else {
			await interaction.reply({ content: 'Did not find the character.' });
		}
		break;


	case 'renamecharacter':
		var OldCharName = interaction.options.getString('oldname');
		var NewCharName = interaction.options.getString('newname').replace(/[\\@#&!`*_~<>|]/g, '');


		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';

		var StringToReply = '';

		if (OldCharName == null || NewCharName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (NewCharName.length > 30) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}


		EmbedString = 'You wish to rename "**' + OldCharName + '**" to "**' + NewCharName + '**"?';

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });

		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});


		collector.on('collect', async interaction => {

			if (interaction.customId === 'yes') {


				const QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
				const QueryCharInfo = await CharacterData.findOne({ Name: OldCharName });
				const NewNameCheck = await CharacterData.findOne({ Name: NewCharName });


				if (QueryPlayerInfo != null && QueryCharInfo != null && NewNameCheck == null) {
					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId || interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {

						QueryCharInfo.Name = NewCharName;
						QueryCharInfo.save();

						await interaction.update({
							content: 'Renamed "**' + OldCharName + '**" to "**' + NewCharName + '**".', embeds: [], components: [],
						});


					}
					else {
						await interaction.update({
							content: 'Character does not belong to you.', embeds: [], components: [],
						});
					}
				}
				else {
					await interaction.update({
						content: 'Did not find player/character in database or name is already taken.', embeds: [], components: [],
					});
				}


			}
			else if (interaction.customId === 'no') {
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});

			}

		});
		break;


	case 'characterdetails':
		var StringToReply = '';
		var CardClass = interaction.options.getString('class');
		var CardDescription = interaction.options.getString('description');
		var CardType = interaction.options.getString('type');
		var CardImage = interaction.options.getString('image');
		var CardAllowed = interaction.options.getBoolean('allow');
		var CharName = interaction.options.getString('character');

		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';

		var PlayerName = await client.users.fetch(PlayerDiscordID);


		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			var QueryCharInfo = await CharacterData.findOne({ Name: CharName });
		}

		if (QueryPlayerInfo != null && QueryCharInfo != null) {
			if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {

				if (CardClass !== null && CardClass !== undefined) {
					QueryCharInfo.CardClass = CardClass;
					StringToReply += '\nUpdated class to ' + CardClass;
				}

				if (CardDescription !== null && CardDescription !== undefined) {
					QueryCharInfo.CardDescription = CardDescription;
					StringToReply += '\nUpdated card description.';
				}

				if (CardType !== null && CardType !== undefined) {
					QueryCharInfo.CardType = CardType;
					StringToReply += '\nUpdated card type to ' + CardType;
				}

				if (CardImage !== null && CardImage !== undefined && isImageURL(CardImage)) {
					QueryCharInfo.CardImage = CardImage;
					StringToReply += '\nUpdated image to ' + CardImage;
				}

				if (CardAllowed !== null && CardAllowed !== undefined) {
					QueryCharInfo.CardAllowed = CardAllowed;
					StringToReply += '\nUpdated allowed status to ' + CardAllowed;
				}

				if (StringToReply === '') {
					StringToReply = 'No options were given, retry and add options.';
				}


				await QueryCharInfo.save();
			}
		}
		else {
			StringToReply = 'No character with that name found, try again.';
		}

		await interaction.reply({
			content: StringToReply,
		});

		break;


	case 'updateallcharactersforcards':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		var NumberofCharacters = 0;
		await CharacterData.find().then((CharacterDatas) => {
			CharacterDatas.forEach((CharacterData) => {
				CharacterData.CardClass = 'Not Set.';
				CharacterData.CardDescription = 'Not Set.';
				CharacterData.CardImage = 'Not Set.';
				CharacterData.CardType = 'Not Set.';
				CharacterData.CardAllowed = false;
				CharacterData.save();
				NumberofCharacters += 1;
			});
		});

		break;


	case 'updateallplayersforcards':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		var NumberofPlayers = 0;
		await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				PlayerData.CardCollection = [];
				PlayerData.LastPull = new Date();
				PlayerData.RecycledPoints = 0;
				PlayerData.CardRating = 0;
				PlayerData.CardNumber = 0;
				PlayerData.save();
				NumberofPlayers += 1;
			});
		});

		console.log('Players Updated:' + NumberofPlayers);
		break;


	case 'createcardset':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var AllReadyCards = [
			[],
			[],
			[],
			[],
			[],
			[],
		];

		var NumberIndex = 0;
		await CharacterData.find({ CardAllowed: true,
			CardDescription:{ $exists: true, $ne: 'Not Set.' },
			CardClass:{ $exists: true, $ne: 'Not Set.' },
			CardImage:{ $exists: true, $ne: 'Not Set.' },
			CardType:{ $exists: true, $ne: 'Not Set.' },
			Status: 'Approved' }).then((CharacterDatas) => {
			CharacterDatas.forEach((CharacterData) => {
				const CardTier = Math.ceil(CharacterData.Level / 2);

				const Card = {
					Name: CharacterData.Name,
					CID: NumberIndex,
					Level: CharacterData.Level,
					Tier: CardTier,
					Rarity: 'Untrained',
					Image: CharacterData.CardImage,
					Class: CharacterData.CardClass,
					Description: CharacterData.CardDescription,
					Type: CharacterData.CardType,
					Special: false,
				};

				switch (CardTier) {

				case 1:
					Card.Rarity = 'Untrained';

					break;
				case 2:
					Card.Rarity = 'Trained';

					break;
				case 3:
					Card.Rarity = 'Expert';

					break;
				case 4:
					Card.Rarity = 'Master';

					break;
				case 5:
					Card.Rarity = 'Legandary';

					break;
				}


				AllReadyCards[0].push(Card);
				AllReadyCards[CardTier].push(NumberIndex);
				NumberIndex += 1;
			});
		});

		var SpecialOne = RandomRange(0, AllReadyCards[0].length);
		var SpecialTwo = RandomRange(0, AllReadyCards[0].length);

		while (SpecialOne === SpecialTwo && AllReadyCards[0].length > 1) {
			SpecialTwo = RandomRange(0, AllReadyCards[0].length);
		}

		AllReadyCards[0][SpecialOne].Special = true;
		AllReadyCards[0][SpecialTwo].Special = true;


		CardSet = {
			CardPool: AllReadyCards,
			CardPoolSize: AllReadyCards[0].length,
			Name: 'Test Card Pool',
			Icon: 'https://cdn.discordapp.com/attachments/1006650762035728424/1055186205752434791/Oracle.webp',
			Tag: 'BETA',
			Created: Date(),
			Active: false,
			Specials: [SpecialOne, SpecialTwo],
		};

		var data = new CardData(CardSet);
		await data.save();

		await interaction.reply({
			content: 'NEW CARD SET MADED', embeds: [], components: [,] });

		break;


	case 'infocard':
		var CardUnformatted = interaction.options.getString('card');
		var CardTag = CardUnformatted.slice(0, 4);
		var CardCID = CardUnformatted.slice(4);


		var InfoSetQuery = await CardData.findOne({
			Tag: CardTag, Active: true,
		});


		if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

			const InfoCard = InfoSetQuery.CardPool[0][CardCID];


			if (InfoCard !== undefined) {


				var CardEmbed = GenCardEmbed(InfoCard, InfoSetQuery);
				embedMessage = await interaction.reply({ embeds: [CardEmbed] });

			}
			else {
				await interaction.reply({
					content: 'Did not find Card ID.', embeds: [], components: [],
				});
				break;
			}

		}
		else {
			await interaction.reply({
				content: 'Did not find Card Set.', embeds: [], components: [],
			});

			break;
		}


		break;


	case 'lastplayed':


		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		await interaction.deferReply();

		DaysAgoRequested = interaction.options.getNumber('days');
		SortMethod = interaction.options.getString('sort');

		if (DaysAgoRequested == null) {
			DaysAgoRequested = 31;
		}

		if (SortMethod == null) {
			var SortMethod = 'played';
		}

		var CurrentDate = new Date();
		var MonthAgoDate = CurrentDate.setDate(CurrentDate.getDate() - DaysAgoRequested);
		var CurrentDate = new Date();
		var CharactersIDsofLastMonth = [];
		var GMsIDsOfDate = [];
		var PlayersPlayed = [];
		var NumberOfReports = 0;

		await ReportData.find({
			RunDate: {
				$gt: MonthAgoDate,
				$lt: CurrentDate,
			},
		}).then((ReportDatas) => {
			ReportDatas.forEach((ReportData) => {

				if (ReportData.SSR === false) {
					NumberOfReports += 1;
					CharactersIDsofLastMonth = CharactersIDsofLastMonth.concat(ReportData.Characters);
					GMsIDsOfDate = GMsIDsOfDate.concat(ReportData.GMs);
				}


			});
		});

		const CharactersCounted = {};

		const GMsCounted = {};

		const countFuncPlayers = keys => {
			CharactersCounted[keys] = ++CharactersCounted[keys] || 1;
		};

		const countFuncGMs = keys => {
			GMsCounted[keys] = ++GMsCounted[keys] || 1;
		};

		CharactersIDsofLastMonth.forEach(countFuncPlayers);
		GMsIDsOfDate.forEach(countFuncGMs);
		
		NumberOfPlayersPlayed = 0


		for (const Element of Object.keys(CharactersCounted)) {
			QueryCharInfo = await CharacterData.findOne({ _id: Element });

			IsPlayerOnList = PlayersPlayed.findIndex(item => item.name === QueryCharInfo.BelongsTo);

			if (IsPlayerOnList === -1) {

				PlayersPlayed.push({ name: QueryCharInfo.BelongsTo, quantity: CharactersCounted[Element], GamesRan: 0 });
				NumberOfPlayersPlayed += 1
			}
			else {

				PlayersPlayed[IsPlayerOnList].quantity += CharactersCounted[Element];
			}

		}

		for (const Element of Object.keys(GMsCounted)) {

			QueryGMInfo = await PlayerData.findOne({ _id: Element });

			IsPlayerOnList = PlayersPlayed.findIndex(item => item.name === QueryGMInfo.DiscordId);


			if (IsPlayerOnList === -1) {

				PlayersPlayed.push({ name: QueryGMInfo.DiscordId, quantity: 0, GamesRan: GMsCounted[Element] });
			}
			else {

				PlayersPlayed[IsPlayerOnList].GamesRan += GMsCounted[Element];
			}
		}


		switch (SortMethod) {
		case 'played':
			PlayersPlayed.sort((b, a) => a.quantity - b.quantity);
			break;

		case 'ran':
			PlayersPlayed.sort(function(a, b) {
				const GamesRanOrder = parseInt(b.GamesRan) - parseInt(a.GamesRan);
				const GamesPlayedOrder = parseInt(b.quantity) - parseInt(a.quantity);
				return GamesRanOrder || GamesPlayedOrder;
			});
			break;

		case 'combined':
			PlayersPlayed.sort((b, a) => (a.quantity + a.GamesRan) - (b.quantity + b.GamesRan));
			break;


		}


		StringToReply = '**' + NumberOfPlayersPlayed + '** players who played in games.';;
		PlayersPlayedOnDisplay = PlayersPlayed.slice(0, 16);

		for (const Element of PlayersPlayedOnDisplay) {
			if (Element.GamesRan == 0) {
				StringToReply += '\n' + Element.name + ' - **' + Element.quantity + '** games played.';
			}
			else {
				StringToReply += '\n' + Element.name + ' - **' + Element.quantity + '** games played and **' + Element.GamesRan + '** games ran.';
			}
		}


		const rowlist = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('backId')
					.setLabel('Previous')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('forwardId')
					.setLabel('Next')
					.setStyle(ButtonStyle.Primary),
			);

		const embed = new EmbedBuilder()
			.setColor(ReportEmbedColor)
			.setTitle(NumberOfReports + ' Games Played/Ran in last ' + String(DaysAgoRequested) + ' days. Sorted by ' + SortMethod)
			.setDescription(StringToReply)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [embed], components: [rowlist] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		let currentIndex = 0;
		collector.on('collect', async interaction => {
			{


				// Increase/decrease index
				if (interaction.customId === 'forwardId' && currentIndex + 16 - PlayersPlayed.length < 0) {currentIndex += 16;}
				else if (currentIndex - 16 >= 0 && interaction.customId === 'backId') {currentIndex -= 16;}


				PlayersPlayedOnDisplay = PlayersPlayed.slice(currentIndex, currentIndex + 16);
				StringToReply = '**' + NumberOfPlayersPlayed + '** players who played in games.';

				for (const Element of PlayersPlayedOnDisplay) {
					if (Element.GamesRan == 0) {
						StringToReply += '\n' + Element.name + ' - **' + Element.quantity + '** games played.';
					}
					else {
						StringToReply += '\n' + Element.name + ' - **' + Element.quantity + '** games played and **' + Element.GamesRan + '** games ran.';
					}
				}

				// Respond to interaction by updating message with new embed
				await interaction.update({
					embeds: [new EmbedBuilder()
						.setColor(ReportEmbedColor)
						.setTitle(NumberOfReports + ' Games Played/Ran in last ' + String(DaysAgoRequested) + ' days. Sorted by ' + SortMethod)
						.setDescription(StringToReply)
						.setTimestamp()
						.setFooter({ text: 'Absalom Living Campaign' }),
					],

					components: [rowlist],
				});


			}
		});


		break;


	case 'pullcard':
		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var PlayerName = await client.users.fetch(PlayerDiscordID);
		var CurrentDate = EuroDateFunc(new Date());
		var LastPullDate;
		var CanPull = false;


		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}


		if (QueryPlayerInfo != null) {

			LastPullDate = EuroDateFunc(QueryPlayerInfo.LastPull);


			if (
				LastPullDate !== CurrentDate
			) {
				CanPull = true;
				QueryPlayerInfo.LastPull = new Date();

			}
			else if (QueryPlayerInfo.RecycledPoints >= 10) {
				CanPull = true;
				QueryPlayerInfo.RecycledPoints -= 10;
			}
			else {
				(
					Message = await interaction.reply({ content: 'You have already pulled a card today and do not have enough recycle points.' })
				);
			}


			if (CanPull === true) {


				const RngValue = RandomRange(0, 99);
				let PullTier = 1;

				if (RngValue >= 95) // special pull
				{PullTier = 6;}
				else

				if (RngValue >= 111) // disabled legendery pull
				{PullTier = 5;}
				else

				if (RngValue >= 111) // disabled master pull
				{PullTier = 4;}
				else

				if (RngValue >= 111) // disabled expert roll
				{PullTier = 3;}
				else

				if (RngValue >= 75) // trained roll
				{PullTier = 2;}
				else {PullTier = 1;} // untrained roll.


				var InfoSetQuery = await CardData.findOne({
					Active: true,
				});


				if (InfoSetQuery !== undefined && InfoSetQuery !== null) {
					let CardPulled;


					while (CardPulled === undefined) {


						if (PullTier === 6) {
							SizeOfPool = InfoSetQuery.Specials.length;
							if (SizeOfPool === 0) {
								Message = await interaction.reply({ content: 'No Special cards to Pull found, scream at Danni.' });
								break;
							}

							CIDCardPulled = InfoSetQuery.Specials[RandomRange(0, SizeOfPool - 1)];

						}
						else {

							SizeOfPool = InfoSetQuery.CardPool[PullTier].length;

							if (SizeOfPool === 0) {
								PullTier -= 1;
								if (PullTier == 0) {
									Message = await interaction.reply({ content: 'No cards to Pull found.' });
									break;
								}
							}
							CIDCardPulled = InfoSetQuery.CardPool[PullTier][RandomRange(0, SizeOfPool - 1)];
						}

						CardPulled = InfoSetQuery.CardPool[0][CIDCardPulled];


						var CardEmbed = GenCardEmbed(CardPulled, InfoSetQuery);
						embedMessage = await interaction.reply({ content: 'You have **' + String(QueryPlayerInfo.RecycledPoints) + '** Recycle Points left and you pulled: ', embeds: [CardEmbed] });

						var PulledCardTag = String(InfoSetQuery.Tag) + CIDCardPulled;


						IsCardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == PulledCardTag);


						if (IsCardOnList === -1) {

							QueryPlayerInfo.CardCollection.push({ CardName: CardPulled.Name, CardTag: PulledCardTag, quantity: 1 });


						}
						else {
							QueryPlayerInfo.CardCollection[IsCardOnList].quantity += 1;
							QueryPlayerInfo.markModified('CardCollection');
						}

						QueryPlayerInfo.CardNumber += 1;

						if (CardPulled.Special == true) {
							QueryPlayerInfo.CardRating += (CardPulled.Level * 2);
						}
						else {
							QueryPlayerInfo.CardRating += CardPulled.Level;
						}

						await QueryPlayerInfo.save();

					}

				}
				else {

					Message = await interaction.reply({ content: 'No set to Pull from found.' });
				}

			}

		}
		break;


	case 'recyclecards':
		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var PlayerName = await client.users.fetch(PlayerDiscordID);

		var RecycleCard = interaction.options.getString('recyclecard');
		var RecycleQty = interaction.options.getNumber('quantity');

		if (PlayerName !== undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
			break;
		}

		if (QueryPlayerInfo !== null) {

			CardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == RecycleCard);


			if (CardOnList === -1) {
				await interaction.reply({ content:  'You does not have the card.' });
				break;
			}


			if (QueryPlayerInfo.CardCollection[CardOnList].quantity < RecycleQty) {
				await interaction.reply({ content:  'You does not have enough cards.' });
				break;
			}


			EmbedString = 'Do you wish recycle **' + String(RecycleQty) + '** copies of **' + QueryPlayerInfo.CardCollection[CardOnList].CardName + '**?';


			var ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {

				switch (interaction.customId) {

				case 'yes':
					var CardTag = RecycleCard.slice(0, 4);
					var CardCID = RecycleCard.slice(4);
					var ForMessageCardName = QueryPlayerInfo.CardCollection[CardOnList].CardName;

					var InfoSetQuery = await CardData.findOne({
						Tag: CardTag,
					});


					if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

						var SpecialMultipler = 1;

						if (InfoSetQuery.CardPool[0][CardCID].Special === true) {
							var SpecialMultipler = 2;
						}

						const RPtoGIVE = InfoSetQuery.CardPool[0][CardCID].Level * SpecialMultipler * RecycleQty;

						QueryPlayerInfo.RecycledPoints += RPtoGIVE;
						QueryPlayerInfo.CardNumber -= RecycleQty;


						QueryPlayerInfo.CardCollection[CardOnList].quantity -= RecycleQty;

						if (QueryPlayerInfo.CardCollection[CardOnList].quantity <= 0) {
							QueryPlayerInfo.CardCollection.splice(CardOnList, 1);
						}

						QueryPlayerInfo.markModified('CardCollection');
						await QueryPlayerInfo.save();

						await interaction.update({
							content: 'You have recycled **' + String(RecycleQty) + '** copies of **' + ForMessageCardName + '** for **' + String(RPtoGIVE) + '** Recycle points.', embeds: [], components: [],
						});

					}
					else {break;}


					collector.stop();
					break;


				case 'no':

					await interaction.update({
						content: 'Cancelled.', embeds: [], components: [],
					});

					collector.stop();
					break;
				}
			});


		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
		}


		break;


	case 'tradecards':


		// trader = person starting the trade
		// buyee = person being asked to trade
		var TraderDiscordID = interaction.user.id;
		var TraderDiscordMention = '<@' + TraderDiscordID + '>';
		var TraderName = await client.users.fetch(TraderDiscordID);

		var TraderCard = interaction.options.getString('offer');
		var BuyeeCard = interaction.options.getString('want');

		var BuyeeDiscordMention = interaction.options.getUser('mention');
		var BuyeeDiscordID = BuyeeDiscordMention.id
		BuyeeDiscordMention = '<@'+BuyeeDiscordID+">"
		
		try {
			var BuyeeName = await client.users.fetch(BuyeeDiscordID);
		}
		catch (error) {
			await interaction.reply({ content: 'No such player in database or other error.' });
			break;
		}

		if (BuyeeDiscordID == TraderDiscordID) {
			await interaction.reply({ content: 'No insider trading, stinky. https://cdn.discordapp.com/attachments/1055467462012964875/1055888466640126094/b38.jpg' });
			break;
		}


		if (TraderName !== undefined && BuyeeName !== undefined) {
			var QueryBuyeeInfo = await PlayerData.findOne({ DiscordId: BuyeeDiscordMention });
			var QueryTraderInfo = await PlayerData.findOne({ DiscordId: TraderDiscordMention });
		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
			break;
		}

		if (QueryTraderInfo !== null && QueryBuyeeInfo !== null) {


			BuyeeCardOnList = QueryBuyeeInfo.CardCollection.findIndex(item => item.CardTag == BuyeeCard);
			TraderCardOnList = QueryTraderInfo.CardCollection.findIndex(item => item.CardTag == TraderCard);

			if (BuyeeCardOnList === -1) {
				await interaction.reply({ content:  BuyeeDiscordMention + ' does not have the card.' });
				break;
			}

			if (TraderCardOnList === -1) {
				await interaction.reply({ content:  'You do not have the card.' });
				break;
			}

			EmbedString = 'Do you wish trade "**'
            + QueryTraderInfo.CardCollection[TraderCardOnList].CardTag + ' - ' + QueryTraderInfo.CardCollection[TraderCardOnList].CardName
            + '**" to ' + BuyeeDiscordMention + ' for their **'
            + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardTag + ' - ' + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName + '**';


			var ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {
				let TradeAccepted = false;

				switch (interaction.customId) {
				case 'yes':

					EmbedString = TraderDiscordMention + ' has asked to trade their "**'
                + QueryTraderInfo.CardCollection[TraderCardOnList].CardTag + ' - ' + QueryTraderInfo.CardCollection[TraderCardOnList].CardName
                 + '**" to ' + BuyeeDiscordMention + ' for your **'
                 + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardTag + ' - ' + QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName +
                 '**\nDo you accept?';


					await interaction.update({
						embeds: [new EmbedBuilder()
							.setColor(ConfirmEmbedColor)
							.setDescription(EmbedString)
							.setTimestamp()
							.setFooter({ text: 'Absalom Living Campaign' }),
						], components: [ConfirmRow] });


					TradeAccepted = true;
					collector.stop();
					break;


				case 'no':
					await interaction.update({
						content: 'Cancelled.', embeds: [], components: [],
					});
					collector.stop();

					break;
				}

				collector = embedMessage.createMessageComponentCollector({
					filter: ({ user }) => user.id === BuyeeDiscordID, time: CollecterTimeout,
				});


				if (TradeAccepted === true) {
					collector.on('collect', async interaction => {

						switch (interaction.customId) {
						case 'yes':
							var TraderCardOnBuyeeList = QueryBuyeeInfo.CardCollection.findIndex(item => item.CardTag == TraderCard);
							var BuyeeCardOnTraderList = QueryTraderInfo.CardCollection.findIndex(item => item.CardTag == BuyeeCard);

							QueryBuyeeInfo.markModified('CardCollection');
							QueryTraderInfo.markModified('CardCollection');


							if (TraderCardOnBuyeeList == -1) {

								QueryBuyeeInfo.CardCollection.push({ CardName: QueryTraderInfo.CardCollection[TraderCardOnList].CardName, CardTag: TraderCard, quantity: 1 });

								QueryTraderInfo.CardCollection[TraderCardOnList].quantity -= 1;


							}
							else {
								QueryBuyeeInfo.CardCollection[TraderCardOnBuyeeList].quantity += 1;
								QueryTraderInfo.CardCollection[TraderCardOnList].quantity -= 1;


							}

							if (BuyeeCardOnTraderList == -1) {

								QueryTraderInfo.CardCollection.push({ CardName: QueryBuyeeInfo.CardCollection[BuyeeCardOnList].CardName, CardTag: BuyeeCard, quantity: 1 });

								QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity -= 1;
								


							}
							else {
								

								QueryTraderInfo.CardCollection[BuyeeCardOnTraderList].quantity += 1;

								QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity -= 1;

								

							}


							if (QueryBuyeeInfo.CardCollection[BuyeeCardOnList].quantity <= 0) {
								QueryBuyeeInfo.CardCollection.splice(BuyeeCardOnList, 1);
							}

							if (QueryTraderInfo.CardCollection[TraderCardOnList].quantity <= 0) {
								QueryTraderInfo.CardCollection.splice(TraderCardOnList, 1);
							}

							QueryBuyeeInfo.markModified('CardCollection.[BuyeeCardOnList]');
							await QueryBuyeeInfo.save();
							QueryTraderInfo.markModified('CardCollection.[TraderCardOnList]');
							await QueryTraderInfo.save();

							await interaction.update({
								content: 'Trade successful!', embeds: [], components: [] });

							break;


						case 'no':
							await interaction.update({
								content: 'Trade offer refused.', embeds: [], components: [],
							});
							collector.stop();
							break;
						}
					});
				}


			});


		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
			break;
		}

		break;


	case 'giftcard':


		// giver = person starting the trade
		// giftee = person being asked to trade
		
		
		var GiverDiscordID = interaction.user.id;
		var GiverDiscordMention = '<@' + GiverDiscordID + '>';
		var GiverName = await client.users.fetch(GiverDiscordID);

		var GiverCard = interaction.options.getString('giftcard');

		var GifteeDiscordMention = interaction.options.getUser('mention');
		var GifteeDiscordID = GifteeDiscordMention.id
		var GifteeDiscordMention = '<@' + GifteeDiscordID + '>'

		try {
			var GifteeName = await client.users.fetch(GifteeDiscordID);
		}
		catch (error) {
			await interaction.reply({ content: 'No such player in database or other error.' });
			break;
		}

		if (GifteeDiscordID == GiverDiscordID) {
			await interaction.reply({ content: 'No self giving, stinky. https://cdn.discordapp.com/attachments/1055467462012964875/1055888466640126094/b38.jpg' });
			break;
		}


		if (GiverName !== undefined && GifteeName !== undefined) {
			var QueryGifteeInfo = await PlayerData.findOne({ DiscordId: GifteeDiscordMention });
			var QueryGiverInfo = await PlayerData.findOne({ DiscordId: GiverDiscordMention });
		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
			break;
		}

		if (QueryGiverInfo !== null && QueryGifteeInfo !== null) {


			GiverCardOnList = QueryGiverInfo.CardCollection.findIndex(item => item.CardTag == GiverCard);

			if (GiverCardOnList === -1) {
				await interaction.reply({ content:  'You do not have the card.' });
				break;
			}

			EmbedString = 'Do you wish gift "**'
    + QueryGiverInfo.CardCollection[GiverCardOnList].CardTag + ' - ' + QueryGiverInfo.CardCollection[GiverCardOnList].CardName
    + '**" to ' + GifteeDiscordMention;


			var ConfirmEmbed = new EmbedBuilder()
				.setColor(ConfirmEmbedColor)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


			var collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			collector.on('collect', async interaction => {


				switch (interaction.customId) {

				case 'yes':
					GiverCardOnGifteeList = QueryGifteeInfo.CardCollection.findIndex(item => item.CardTag == GiverCard);


					if (GiverCardOnGifteeList === -1) {

						QueryGifteeInfo.CardCollection.push({ CardName: QueryGiverInfo.CardCollection[GiverCardOnList].CardName, CardTag: GiverCard, quantity: 1 });
						QueryGiverInfo.CardCollection[GiverCardOnList].quantity -= 1;


					}
					else {
						QueryGifteeInfo.CardCollection[GiverCardOnGifteeList].quantity += 1;
						QueryGiverInfo.CardCollection[GiverCardOnList].quantity -= 1;

					}

					if (QueryGiverInfo.CardCollection[GiverCardOnList].quantity <= 0) {
						QueryGiverInfo.CardCollection.splice(GiverCardOnList, 1);
					}

					QueryGiverInfo.CardNumber -= 1;
					QueryGifteeInfo.CardNumber += 1;

					QueryGifteeInfo.markModified('CardCollection');
					await QueryGifteeInfo.save();

					QueryGiverInfo.markModified('CardCollection');
					await QueryGiverInfo.save();


					var CardTag = GiverCard.slice(0, 4);
					var CardCID = GiverCard.slice(4);


					var InfoSetQuery = await CardData.findOne({
						Tag: CardTag,
					});


					if (InfoSetQuery !== undefined && InfoSetQuery !== null) {

						const InfoCard = InfoSetQuery.CardPool[0][CardCID];


						if (InfoCard !== undefined) {

							var CardEmbed = GenCardEmbed(InfoCard, InfoSetQuery);


						}
						else {

							await interaction.update({
								content: 'Did not find Card ID to display but gifting was complete.', embeds: [], components: [],
							});
							break;
						}

					}
					else {
						await interaction.reply({
							content: 'Did not find Card Set to display card but gifting was complete.', embeds: [], components: [],
						});

						break;
					}


					await interaction.update({
						content:  GiverDiscordMention + ' gave **' + GiverCard + '** to ' + GifteeDiscordMention, embeds: [CardEmbed], components: [] });
					collector.stop();
					break;


				case 'no':
					await interaction.update({
						content: 'Cancelled.', embeds: [], components: [],
					});
					collector.stop();

					break;
				}


			});


		}
		else {
			await interaction.reply({ content: 'No such player(s) in database or other error.' });
			break;
		}

		break;

	case 'updatexpsystem2':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}
		var NumberofPlayers = 0;
		var PlayerList = [];

		await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				PlayerList.push(PlayerData);
			});
		});

		for (const Player of PlayerList) {

			Player.CharacterXP = 0;
			Player.ReportXP = 0;
			Player.GMXP = 0;
			NumberOfReportsToPull = Player.UnassignedReports.length;
			for (let index = 0; index < NumberOfReportsToPull; index++) {

				const IDtofind = Player.UnassignedReports[index];

				QueryReportInfo = await ReportData.findOne({ _id: IDtofind });
				if (QueryReportInfo !== null) {
					Player.ReportXP += QueryReportInfo.XP;
				}
				else {
					console.log('\n***ERR*** - Failed To Find Report: ' + QueryPlayerInfo.UnassignedReports[index]);
				}
			}

			Player.save();
			NumberofPlayers += 1;
			console.log('Updated: ' + Player.DiscordId);

		}


		console.log('DONE - Players Updated: ' + NumberofPlayers);

		NumberOfReports = 0;
		ReportsList = [];


		await ReportData.find().then((ReportDatas) => {
			ReportDatas.forEach((ReportData) => {

				if (ReportData.SSR === false) {
					ReportsList.push(ReportData);
					NumberOfReports += 1;

				}

			});
		});

		for (const ReportOnList of ReportsList) {
			PlayersToAward = ReportOnList.GMs;
			for (const Element of PlayersToAward) {
				QueryPlayerInfo = await PlayerData.findOne({ _id: Element });
				QueryPlayerInfo.GMXP += Math.round(ReportOnList.XP * 0.5);
				await QueryPlayerInfo.save();
			}
			console.log('DONE - Reports Updated: ' + ReportOnList.Name);
		}


		console.log('DONE - Reports Updated: ' + NumberOfReports);

		break;


	case 'sortcards':
		var SortType = interaction.options.getString('type');
		await interaction.deferReply();


		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';


		PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
		var PlayerDiscordID = PlayerDiscordMention.replace(/[\\<>@#&!]/g, '');
		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await interaction.editReply({ content: 'No such player in database or other error.' });
			break;
		}


		if (typeof PlayerName != undefined) {
			var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}

		if (QueryPlayerInfo != null) {
			// sort by quantity, top to bottom.
			if (SortType === 'QTtoB') {
				QueryPlayerInfo.CardCollection.sort(function(a, b) {
					const textA = a.quantity;
					const textB = b.quantity;
					return (textA > textB) ? -1 : (textA < textB) ? 1 : 0;
				});
			}

			if (SortType === 'QBtoT') {
				QueryPlayerInfo.CardCollection.sort(function(a, b) {
					const textA = a.quantity;
					const textB = b.quantity;
					return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
				});
			}

			if (SortType === 'tag') {

				for (const iterator of QueryPlayerInfo.CardCollection) {

					iterator.CID = parseInt(iterator.CardTag.slice(4));
					iterator.SET = iterator.CardTag.slice(0, 4);
				}

				QueryPlayerInfo.CardCollection.sort(function(a, b) {
					const SET_order = a.SET.localeCompare(b.SET);
					const CID_order = parseInt(a.CID) - parseInt(b.CID);
					return SET_order || CID_order;
				});

				for (const iterator of QueryPlayerInfo.CardCollection) {

					delete iterator.CID;
					delete iterator.SET;
				}
			}

			if (SortType === 'CharName') {
				QueryPlayerInfo.CardCollection.sort(function(a, b) {
					const textA = a.CardName;
					const textB = b.CardName;
					return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
				});
			}


			QueryPlayerInfo.save();
			await interaction.editReply({ content: 'Card Collection sorted.' });
		}
		break;


	case 'addgmstosr':

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var GMsFromMessage = [
			interaction.options.getUser('gm-1'),
			interaction.options.getUser('gm-2'),
			interaction.options.getUser('gm-3'),
			interaction.options.getUser('gm-4'),
			interaction.options.getUser('gm-5'),
			interaction.options.getUser('gm-6'),
			interaction.options.getUser('gm-7'),
			interaction.options.getUser('gm-8'),
		];


		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.reply({ content: 'Not all inputs given.' });
			break;
		}
		else if (ReportName.length >= 60) {
			await interaction.reply({ content: 'Name is too long.' });
			break;
		}

		if (GMsFromMessage.every(element => element === null)) {
			await interaction.reply({ content: 'No gms given.' });
			break;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		for (iterator of GMsFromMessage) {
			if (iterator !== null) {
				iterator = "<@" + iterator.id +">";
			
			}
		}

		EmbedString = 'Do you wish to add the following players as GMs to SR "**' + ReportName + '**"?\n' + GMsFromMessage;

		var ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.reply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		var collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				GMsAddToReport(GMsFromMessage, ReportName, interaction);
				collector.stop();

				break;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				break;

			}

		});

		break;

	case 'infolevels':


		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		await interaction.deferReply();

		CharacterLevelsUnclean = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		TotalCharacters = 0;
		TotalLevels = 0;
		StringToSend = '';


		await CharacterData.find({
			Status: 'Approved' }).then((CharacterDatas) => {
			CharacterDatas.forEach((CharacterData) => {
				CharacterLevelsUnclean[CharacterData.Level] += 1;
				TotalCharacters += 1;
				TotalLevels += CharacterData.Level;
			});
		});

		StringToSend = 'Average Character Level: **' + String((TotalLevels / TotalCharacters).toFixed(2)) + '**\n';

		for (let index = 1; index < CharacterLevelsUnclean.length; index++) {
			const element = CharacterLevelsUnclean[index];
			StringToSend += 'Level **' + index + '**s: **' + element + '**\n';
		}


		const levelembed = new EmbedBuilder()
			.setColor(ReportEmbedColor)
			.setTitle('Info on Character Levels')
			.setDescription(StringToSend)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [levelembed] });


		break;


		case 'setmerge':
		
		MainSet = "BETA"
		Expansion = "EBET"

		MainSetData = await CardData.findOne({
			Tag: MainSet })

		ExpansionData = await CardData.findOne({
			Tag: Expansion })

		NewCards = []
		
		for (let index = 0; index < ExpansionData.CardPool[0].length; index++) {

			CardToLook = ExpansionData.CardPool[0][index]
			

				IsCardOnSet = MainSetData.CardPool[0].findIndex(item => item.Name === CardToLook.Name);

			if (IsCardOnSet === -1) {
				NewCards.push(ExpansionData.CardPool[0][index]);
		
			}
		}

	
		
		console.log(NewCards)
		console.log(NewCards.length)
		let MainSetSize = MainSetData.CardPoolSize
		for (let index = 0; index < NewCards.length; index++) {
			let Card = NewCards[index];
			NewCards[index].CID = MainSetSize + index
			MainSetData.CardPool[0].push(Card)

			MainSetData.CardPool[Card.Tier].push(MainSetSize + index)
			MainSetData.CardPoolSize += 1
		}
		MainSetData.markModified('CardPool')
		await MainSetData.save()

		break






		case 'addrp':
			
		await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			interaction.reply({ content: 'You lack the role(s) to use this command.' });
			break;
		}

		var PlayerDiscordData = interaction.options.getUser('mention');
		let RPtoGive = interaction.options.getNumber('amount')

		if (PlayerDiscordData === null) {
	
			let PlayerListToGiveRP = await PlayerData.find()


			for (const PlayerData of PlayerListToGiveRP) {
			PlayerData.RecycledPoints += RPtoGive
			await PlayerData.save()
			}

			interaction.editReply({ content: 'Gave everyone **' +  RPtoGive + '** Recycle Points'});
			break
		}

		else {
			var PlayerDiscordID = PlayerDiscordData.id
			var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'

			
			if (typeof PlayerDiscordData != undefined) {
				var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
			}
			
			if (QueryPlayerInfo != null) {
				QueryPlayerInfo.RecycledPoints += RPtoGive
				await QueryPlayerInfo.save()
				interaction.editReply({ content: 'Gave ' + PlayerDiscordMention + " **" + RPtoGive + '** Recycle Points'})
		}

	}
	break


	}

	

	

});


// Login to Discord with your client's token
client.login(token);
