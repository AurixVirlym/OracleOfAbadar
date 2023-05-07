/* eslint-disable no-undef */
const mongoose = require('mongoose');
const { messageLink } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const { bold, italic, strikethrough, underscore, spoiler, quote, blockQuote } = require('discord.js');



const GoldAtLevel = [0, 20, 40, 80, 140, 260, 460, 749, 1140, 1640, 2340];
const GoldPerXP = [0, 5, 10, 15, 30, 50, 70, 100, 125, 175, 225];

const RoleBotAdmin = 'Bot Admin';
const RoleStaff = 'Staff';
const RolePlayerGM = 'Player GM';
const CollecterTimeout = 600000;
const DateOptions = {
	day: 'numeric',
	month: 'numeric',
	year: 'numeric',
};
const PlayerEmbedColor = '1ABC9C';
const CharacterEmbedColor = 'BC1A3A';
const ConfirmEmbedColor = 'F1C40F';
const ReportEmbedColor = '9B59B6';

const CardSchema = new mongoose.Schema({
	CardPool: Array,
	CardPoolSize: Number,
	Name: String,
	Icon: String,
	Tag: String,
	Created: Date,
	Active: Boolean,
	Specials: Array,
	Eternals: Array,
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
	CardSort: String,
	FirstSR: Boolean,
	EternalCards: Number,
	WeeklyExpedition: Date,
	ExpeditionTier: String,
	ExpeditionPasses: Number,
	ExpeditionLucky: Number,


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

function WeekNumber(currentDate) {

	
	
	
	let UTCOFFSET = currentDate.getTimezoneOffset()
	currentDate.setMinutes(currentDate.getMinutes() + UTCOFFSET)


    startDate = new Date(currentDate.getUTCFullYear(), 0, 1);
    var days = Math.floor((currentDate - startDate) /
        (24 * 60 * 60 * 1000));
         
    return Math.ceil(days / 7);

}


function GenCardEmbed(Card, CardSet) {
	let CardTitle;
	if (Card.Special === true) {
		CardEmbedColour = 0xF1C40F;
		CardTitle = bold(':star:' + Card.Name + ' - ' + CardSet.Tag + Card.CID);
	}
	else {
		switch (Card.Rarity) {
		case 'Untrained':
			CardEmbedColour = 'a2decc';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;

		case 'Trained':
			CardEmbedColour = '1abc9c';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;

		case 'Expert':
			CardEmbedColour = '217965';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;

		case 'Master':
			CardEmbedColour = '193d33';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;

		case 'Legendary':
			CardEmbedColour = '000000';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;

		case 'Eternal':
			CardEmbedColour = 'E91E63';
			CardTitle = bold(':star:' + Card.Name + ' - ' + CardSet.Tag + Card.CID + ':star:');
			break;

		default:
			CardEmbedColour = 'aaa9ad';
			CardTitle = bold(Card.Name + ' - ' + CardSet.Tag + Card.CID);
			break;
		}
		
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


async function RecalcCharacter(CharToRecalc, interaction,PlayerDiscordMention) {
	
	StringToReply = String(CharToRecalc);
	let QueryCharInfo;

	try {
		QueryCharInfo = await CharacterData.findOne({ Name: CharToRecalc, BelongsTo: PlayerDiscordMention });
	}
	catch (error) {
		await interaction.editReply({ content: 'Did not find the character ***' + CharToRecalc + '***.' });
		return;
	}

	if (QueryCharInfo !== null) {
		let ReportsSucceeded = 0;
		const ReportsToCheck = QueryCharInfo.AssignedReports;
		QueryCharInfo.Level = QueryCharInfo.StartingLevel;
		QueryCharInfo.CurrentXP = QueryCharInfo.ManualXP;
		QueryCharInfo.TotalXP = QueryCharInfo.ManualXP;
		QueryCharInfo.MaxGold = GoldAtLevel[QueryCharInfo.StartingLevel];

		for (const iterator of ReportsToCheck) {


			let QueryReportinfo = await ReportData.findOne({ _id: iterator });


			if (QueryReportinfo !== null && typeof QueryReportinfo !== undefined) {
				QueryCharInfo.CurrentXP += QueryReportinfo.XP;
				QueryCharInfo.TotalXP += QueryReportinfo.XP;
				ReportsSucceeded += 1;

			}
			else {await interaction.editReply({ content: 'Did not find the character ***' + CharToRecalc + '***.' });}

		}

		StringToReply = 'Recalculated ' + ReportsSucceeded + '/' + ReportsToCheck.length + ' for ***' + QueryCharInfo.Name + '***.';

		while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
			QueryCharInfo.CurrentXP -= 1000;
			QueryCharInfo.Level += 1;
		}


		QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

		StringToReply += '\n***' + QueryCharInfo.Name + '*** is level ' + QueryCharInfo.Level + ' with a max gold of ' + QueryCharInfo.MaxGold + '.';
		await QueryCharInfo.save();
		await interaction.editReply({ content: StringToReply });
	}
	return

}

async function CharsAddToReport(CharsToAddArray, UsersFromMessage, ReportToQuery, interaction) {

	await interaction.deferUpdate();
	let StringToReply = 'Character(s) added:\n';
	const QueryReportInfo = await ReportData.findOne({ Name: ReportToQuery });
	
	if (QueryReportInfo !== null && CharsToAddArray !== undefined) {

		if (QueryReportInfo.SSR === true) {
			await interaction.editReply({ content: 'Report is an SSR.', embeds: [], components: [] });
			return;
		}

		if (QueryReportInfo.Published === false) {

			CharsToAddArray = CharsToAddArray.filter(function(el) {
				return el != null;
			});

			UsersFromMessage = UsersFromMessage.filter(function(el) {
				return el != null;
			});


			if (CharsToAddArray !== null) {

				for (let index = 0; index < CharsToAddArray.length; index++) {
					let Element = CharsToAddArray[index];
					let DiscordMention = UsersFromMessage[index]
					let SameCheck = false;

					QueryCharInfo = await CharacterData.findOne({ Name: Element, BelongsTo: DiscordMention });

					if (QueryCharInfo !== null && typeof QueryCharInfo !== undefined) {
						SameCheck = await QueryReportInfo.Characters.includes(QueryCharInfo._id);

						if (SameCheck == false) {
							StringToReply += QueryCharInfo.Name + " " + DiscordMention + ' to ' + QueryReportInfo.Name + '.\n';
							QueryReportInfo.Characters.push(QueryCharInfo._id);

						}
						else {(StringToReply += QueryCharInfo.Name  + " " + DiscordMention + ' already is in ' + QueryReportInfo.Name + '.\n');}

					}
					else {(StringToReply += 'Character ' + Element + ' does not exist or user not given.\n');}
					
				}
				

				await QueryReportInfo.save();



			}
			else {StringToReply = 'No characters found.';}
		}
		else {StringToReply = 'Report already published.';}
	}
	else {StringToReply = 'Report not found.';}
	await interaction.editReply({ content: StringToReply, embeds: [], components: [] });
	return

}

async function GMsAddToReport(GMsToAddArray, ReportToQuery, interaction) {
	await interaction.deferUpdate();
	let StringToReply = 'GM(s) added:\n';
	const QueryReportInfo = await ReportData.findOne({ Name: ReportToQuery });
	
	if (QueryReportInfo !== null && GMsToAddArray !== undefined) {

		if (QueryReportInfo.SSR === true) {
			await interaction.editReply({ content: 'Report is an SSR.', embeds: [], components: [] });
			return;
		}

		if (QueryReportInfo.Published === false) {

			GMsToAddArray = GMsToAddArray.filter(function(el) {
				return el != null;
			});


			if (GMsToAddArray !== null) {


				for (const Element of GMsToAddArray) {
					let SameCheck = false;
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



			}
			else {StringToReply = 'No player found.';}
		}
		else {StringToReply = 'Report already published.';}
	}
	else {StringToReply = 'Report not found.';}
	await interaction.editReply({ content: StringToReply, embeds: [], components: [] });
return
}


async function PublishSR(QueryReportInfo, interaction) {
	let QueryCharacterInfos = []
	let ProcessSuccess = 0;
	let StringToReply = '';
	let CharsToReward;
	if (QueryReportInfo !== null) {
		if (QueryReportInfo.Published === false) {

			CharsToReward = QueryReportInfo.Characters;

			


			if (QueryReportInfo.GMs !== null) {

				let QueryPlayerInfos = await PlayerData.find({
					'_id': { 
						$in: QueryReportInfo.GMs
					}
					})
						
					for (let QueryPlayerInfo of QueryPlayerInfos) {

						if (QueryPlayerInfo !== null) {

							QueryPlayerInfo.ExpeditionPasses += 1;
							QueryPlayerInfo.UnassignedReports.push(QueryReportInfo._id);
	
							QueryPlayerInfo.ReportXP += QueryReportInfo.XP;
	
							StringToReply += '\nGave report ***"' + QueryReportInfo.Name + '"*** to ' + QueryPlayerInfo.DiscordId + ' as an unassigned report and 1 Expedition Pass';
	
	
							if (QueryReportInfo.SSR === false) {
								QueryPlayerInfo.GMXP += Math.round(QueryReportInfo.XP * 0.5);
								QueryPlayerInfo.FirstSR = true
							}
	
							await QueryPlayerInfo.save();
							ProcessSuccess += 1;
	
						}
						else {
							StringToReply += '\nA Database ID was not found.';
							console.log("SSR Making fucked, missing a Database ID.")
						}
						
					}
							
				}else {
				return 'No GM found on Report.'
			}

			
			if (CharsToReward !== null) {

				QueryCharacterInfos = await CharacterData.find({
					'_id': { 
						$in: CharsToReward
					}
					})

				for (let QueryCharInfo of QueryCharacterInfos) {
					{
						
						if (QueryCharInfo !== null) {

							if (QueryCharInfo.CurrentXP == 0 && QueryCharInfo.StartingLevel == QueryCharInfo.Level){
								let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: QueryCharInfo.BelongsTo });
								QueryPlayerInfo.FirstSR = true
								await QueryPlayerInfo.save()
							}

							
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
							StringToReply += '\nA character was not found in database.';
						}
					}
				}

				QueryReportInfo.Published = true;
				await QueryReportInfo.save();
				StringToReply += '\n***' + QueryReportInfo.Name + '*** has been published.';

			}
			else {StringToReply = 'No characters in Report: ' + QueryReportInfo.Name + '.';
			return StringToReply}
		}
		else {StringToReply = 'Report ' + QueryReportInfo.Name + ' already published.';
		return StringToReply}

	}
	else {StringToReply = 'Report ' + QueryReportInfo.Name + ' not found.';
	return StringToReply
	}

	if (QueryCharacterInfos.length != CharsToReward.length) {
		StringToReply += '\nNot every character on the Report was found - ' + String(CharsToReward.length - QueryCharacterInfos.length) +"/" +String(CharsToReward.length);
	} 

	if (StringToReply.length >= 2000) {
		StringToReply = StringToReply.slice(0, 1984) + '\nMessageTooLong';
	}


	if (QueryReportInfo.SSR === true) {
		StringToReply = 'SSR Published and given out to ' + ProcessSuccess + '/' + QueryReportInfo.GMs.length + ' players.';
		return StringToReply
	}


	
	return StringToReply
}

function AutoCalcSlots(QueryPlayerInfo) {

	let MaxSlots = 1

	if (QueryPlayerInfo.TotalXP <= 8000){
		MaxSlots += Math.floor(QueryPlayerInfo.TotalXP / 2000)
	} else

	{
		MaxSlots = 5
		let XPslotCalc = Math.floor((QueryPlayerInfo.TotalXP - 8000) / 2000)
		let ExtraSlots = 0

		while (XPslotCalc > 0) {
			XPslotCalc -= (2 + ExtraSlots)
			if (XPslotCalc >= 0) {
				ExtraSlots += 1
			}
		}
		MaxSlots += ExtraSlots

	}

	if (QueryPlayerInfo.FirstSR === true){
		MaxSlots += 1
	}

	return MaxSlots


}


function NumberTierToString(tier) {
	switch (tier) {
			case 1:
			return "Untrained"
			case 2:
			return "Trained"

			case 3:
			return "Expert"

			case 4:
			return "Master"


			case 5:
			return "Legendary"
		
			case 6:
			return "Eternal"
			

	
		default:
			return "Err"
			
	}
}

function StringTierToNumber(tier) {
	switch (tier) {
			case "Untrained":
			return 1

			case "Trained":
			return 2

			case "Expert":
			return 3

			case "Master":
			return 4

			case "Legendary":
			return 5

			case "Eternal":
			return 6

	
		default:
			return 0
	}
}

function SortCards(QueryPlayerInfo) {

	let SortType = QueryPlayerInfo.CardSort
	
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

	if (SortType === 'lvl') {



		QueryPlayerInfo.CardCollection.sort(function(a, b) {
			const Level_order = parseInt(b.CardLevel) - parseInt(a.CardLevel);
			const Type_order = a.CardType.localeCompare(b.CardType);
			return Level_order || Type_order;
		});
	}

	return QueryPlayerInfo
}

async function PullCard(interaction,QueryPlayerInfo,SetsToPull,PullType,RPcost,RarityOdds) {
				const RngValue = RandomRange(1, 100);

				let PullTier = 1;
			
				
				if (RngValue >= 100) // eternal pull
				{PullTier = 7;}
				else

				if (RngValue >= RarityOdds.Special) // special pull
				{PullTier = 6;}
				else

				if (RngValue >= (RarityOdds.Legendary)) // disabled legendery pull
				{PullTier = 5;}
				else

				if (RngValue >= (RarityOdds.Master)) // disabled master pull
				{PullTier = 4;}
				else

				if (RngValue >= (RarityOdds.Expert)) // disabled expert roll
				{PullTier = 3;}
				else

				if (RngValue >= (RarityOdds.Trained)) // trained roll
				{PullTier = 2;}
				else {PullTier = 1;} // untrained roll.

				if (RPcost >= 1000){
					PullTier = 7
				}

				let CardsPullable = [[],[],[],[],[],[],[],[]]
				let CardCIDAdjust = 0
				
				await CardData.find({
					Tag: { $in: SetsToPull}
				}).then((SetDatas) => {
					SetDatas.forEach((SetData) => {
						

						for (const card of SetData.CardPool[0]) {
							card.Tag = SetData.Tag
						}



						if (CardCIDAdjust != 0){
							
							
							for (let CardTier = 1; CardTier < 5; CardTier++) {

								

								for (let index = 0; index < SetData.CardPool[CardTier].length; index++) {
								
									SetData.CardPool[CardTier][index] += CardCIDAdjust
								}
								
							}

							for (let index = 0; index < SetData.Specials.length; index++) {
								
								SetData.Specials[index] += CardCIDAdjust
							}
						
							for (let index = 0; index < SetData.Eternals.length; index++) {
								
								SetData.Eternals[index] += CardCIDAdjust
							}
							

							
						}

						for (let CardTier = 0; CardTier < 5; CardTier++) {
							if (SetData.CardPool[CardTier].length !== 0)
						{
							CardsPullable[CardTier] = CardsPullable[CardTier].concat(SetData.CardPool[CardTier])
						}
						}
						CardsPullable[6] = CardsPullable[6].concat(SetData.Specials)
						CardsPullable[7] = CardsPullable[7].concat(SetData.Eternals)
					
						CardCIDAdjust += SetData.CardPool[0].length
						

					})
				})
				
				
				

				if (typeof CardsPullable !== undefined && CardsPullable !== null) {
					let CardPulled;


					while (CardPulled === undefined) {

						if (PullTier === 7) {
							SizeOfPool = CardsPullable[7].length;
							if (SizeOfPool === 0) {
								Message = await interaction.editReply({ content: 'No Eternals cards to Pull found, scream at Danni.',ephemeral: false });
								break;
							}

							CIDCardPulled = CardsPullable[7][RandomRange(0, SizeOfPool - 1)];

						} else


						if (PullTier === 6) {
							SizeOfPool = CardsPullable[6].length;
							if (SizeOfPool === 0) {
								Message = await interaction.editReply({ content: 'No Special cards to Pull found, scream at Danni.',ephemeral: false });
								break;
							}

							CIDCardPulled = CardsPullable[6][RandomRange(0, SizeOfPool - 1)];

						}
						else { 
							
						

							SizeOfPool = CardsPullable[PullTier].length;

							if (SizeOfPool === 0) {
								PullTier -= 1;
								if (PullTier == 0) {
									Message = await interaction.editReply({ content: 'No cards to Pull found.',ephemeral: false });
									break;
								}
							}
							CIDCardPulled = CardsPullable[PullTier][RandomRange(0, SizeOfPool - 1)];
							
					
						}

						CardPulled = CardsPullable[0][CIDCardPulled];


						let InfoSetQuery = await CardData.findOne({ Tag: CardPulled.Tag })

						

						let PulledCardTag = String(CardPulled.Tag + CardPulled.CID)


						IsCardOnList = QueryPlayerInfo.CardCollection.findIndex(item => item.CardTag == PulledCardTag);


						if (IsCardOnList === -1) {
							let TypeShortened
							switch (CardPulled.Type) {
								case "Support":
									TypeShortened = "SUP"
									break;
								case "Controller":
									TypeShortened = "CON"
									break;
								case "Artillery ":
									TypeShortened = "ART"
									break;
								case "Artillery":
									TypeShortened = "ART"
									break;
								case "Striker":
									TypeShortened = "STR"
									break;
							}

							QueryPlayerInfo.CardCollection.push({ CardName: CardPulled.Name, CardTag: PulledCardTag, quantity: 1, CardLevel: CardPulled.Level, CardType: TypeShortened });


						}
						else {
							QueryPlayerInfo.CardCollection[IsCardOnList].quantity += 1;
							QueryPlayerInfo.markModified('CardCollection');
						}

						QueryPlayerInfo.CardNumber += 1;

						if (CardPulled.Special == true) {
							QueryPlayerInfo.CardRating += (CardPulled.Level * 2);
						}
						else if (CardPulled.Tier === 6){
							QueryPlayerInfo.CardRating += (CardPulled.Level * 5);
						} else {
							QueryPlayerInfo.CardRating += CardPulled.Level;
						}

						switch (PullType) {
							case "Daily":
								QueryPlayerInfo.LastPull = new Date();
								break;
						
							case "RP":
								QueryPlayerInfo.RecycledPoints -= RPcost;
								break;
						}

                        SortCards(QueryPlayerInfo)
						await QueryPlayerInfo.save();

						let CardEmbed = GenCardEmbed(CardPulled, InfoSetQuery);
						let embedMessage = await interaction.editReply({ content: 'You have **' + String(QueryPlayerInfo.RecycledPoints) + '** Recycle Points left and you pulled: ', embeds: [CardEmbed],ephemeral: false });
						return
					}

				}
				else {

					Message = await interaction.editReply({ content: 'No set to Pull from found.', ephemeral: false });
				}

			}

const NumberOfUniqueCards = 163
		
	



module.exports = {
	GoldAtLevel,
	GoldPerXP,
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	DateOptions,
	PlayerEmbedColor,
	CharacterEmbedColor,
	ConfirmEmbedColor,
	ReportEmbedColor,
	NumberOfUniqueCards,
	CharacterData,
	PlayerData,
	ReportData,
	CardData,
	RandomRange,
	CalcGoldFromXP,
	EuroDateFunc,
	GenCardEmbed,
	RecalcCharacter,
	CharsAddToReport,
	GMsAddToReport,
	PublishSR,
	ConfirmRow,
	AutoCalcSlots,
	SortCards,
	WeekNumber,
	NumberTierToString,
	StringTierToNumber,
	PullCard,
};
