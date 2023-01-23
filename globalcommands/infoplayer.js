const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	PlayerEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
	AutoCalcSlots,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('infoplayer')
	.setDescription('Gives info on a existing player.')
	.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.'))
	.addBooleanOption(option => option.setName('retired').setDescription('Do you wish to see retired characters?')),
	async execute(interaction,client) {
	
		await interaction.deferReply();

		const PlayerDiscordData= interaction.options.getUser('mention');
		let SeeRetiredChars = interaction.options.getBoolean('retired')
		let PlayerDiscordID, PlayerDiscordMention, PlayerName

		if (SeeRetiredChars == null){
			SeeRetiredChars = false
		}

		if (PlayerDiscordData == null) {
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerName = interaction.user
		}

		else {
			PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerName = PlayerDiscordData
		}

		if (typeof PlayerName === undefined) {
			return
		}
	
		const  QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		
		if (QueryPlayerInfo != null) {

			
			const AllOwnedCharsNumber = QueryPlayerInfo.Characters.length;
			
			let RetiredCharsNumber = 0 
			QueryPlayerInfo.TotalXP = 0;
			QueryPlayerInfo.UntotalXP = 0;
			QueryPlayerInfo.CharacterXP = 0;
			const CharInfo = [];
			MaxIndexLength = AllOwnedCharsNumber;
			for (i = 0; i < AllOwnedCharsNumber; i++) {
				CharPulled = await CharacterData.findById(QueryPlayerInfo.Characters[i]);
				if (CharPulled != null) {

					if (CharPulled.Status == "Retired"){
						RetiredCharsNumber += 1
					}
					
					if (SeeRetiredChars == false && CharPulled.Status == "Retired") {
						continue 
					}
					
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
			
			QueryPlayerInfo.CharacterSlots = AutoCalcSlots(QueryPlayerInfo)

			await QueryPlayerInfo.save();

			let StringToEmbed = '\n' +CharInfo.slice(0, 10).toString().replace(/,/g, '');

			const PlayerInfoSting = bold(
				'Total XP: ' + QueryPlayerInfo.TotalXP
        + ' - Character Slots: ' + (AllOwnedCharsNumber - RetiredCharsNumber) + '/' + QueryPlayerInfo.CharacterSlots
        + '\nCharacter XP: ' + QueryPlayerInfo.CharacterXP
        + ' - Report XP: ' + QueryPlayerInfo.ReportXP
        + ' - GM XP: ' + QueryPlayerInfo.GMXP,
			);


			// unassigned Report Info
			const UnassignedReportInfo = [];
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

			const CardCollectionInfo = [];
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


			let collector = embedMessage.createMessageComponentCollector({
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
					StringToEmbed = '\n' + CharInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
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
							StringToEmbed = '\n' + CharInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
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
			await interaction.editReply({ content: 'No such player in database or other error.' });
		}
	
	
	},
};