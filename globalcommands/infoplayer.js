const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	PlayerEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
	AutoCalcSlots,
	SortCards,
	NumberOfUniqueCards,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('infoplayer')
	.setDescription('Gives info on a existing player.')
	.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.'))
	.addBooleanOption(option => option.setName('retired').setDescription('Do you wish to see retired characters?'))
	.addBooleanOption(option => option.setName('mobile').setDescription('Do you wish to compress the display? Better for Mobile')),
	async execute(interaction,client,ContextUser,EphemeralCheck) {
	
		if (EphemeralCheck == null){
			EphemeralCheck = false
		}
	
		await interaction.deferReply( {ephemeral: EphemeralCheck});

		const PlayerDiscordData= interaction.options.getUser('mention');
		let SeeRetiredChars = interaction.options.getBoolean('retired')
		let RemoveSpacesForMobile = interaction.options.getBoolean('mobile')
		let PlayerDiscordID, PlayerDiscordMention, PlayerName

		if (SeeRetiredChars == null){
			SeeRetiredChars = false
		}

		if (RemoveSpacesForMobile == null){
			RemoveSpacesForMobile = false
		}

		if (ContextUser != null){
			PlayerDiscordID = ContextUser
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			PlayerName = interaction.user
		} else

		if (PlayerDiscordData == null) {
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerName = interaction.user
		}

		else {
			PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerName = interaction.user
		}

		if (typeof PlayerName === undefined) {
			return
		}
	
		let  QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		
		if (QueryPlayerInfo != null) {

			
			const AllOwnedCharsNumber = QueryPlayerInfo.Characters.length;
			const AllOwnedCharsIDs = QueryPlayerInfo.Characters
			let RetiredCharsNumber = 0 
			QueryPlayerInfo.TotalXP = 0;
			QueryPlayerInfo.UntotalXP = 0;
			QueryPlayerInfo.CharacterXP = 0;
			const CharInfo = [];
			MaxIndexLength = AllOwnedCharsNumber;

			await CharacterData.find({
				'_id': { 
					$in: AllOwnedCharsIDs
				}
				}).then((QueryCharInfos) => {
					QueryCharInfos.forEach((CharPulled) => {
			
					
				if (CharPulled != null) {

					if (CharPulled.Status == "Retired"){
						RetiredCharsNumber += 1
					}
					
					if (SeeRetiredChars == false && CharPulled.Status == "Retired") { 
					}
					else{

						let SpacedCharStatus = CharPulled.Status
						let SpacedCharName = CharPulled.Name
						let SpacedCharLevel = String(CharPulled.Level)
						let SpacedCharXP = String(CharPulled.CurrentXP)
						let SpacedCurrentGP = String((CharPulled.MaxGold - CharPulled.SpentGold.toFixed(2)).toFixed(2))
						let SpacedMaxGP = String(CharPulled.MaxGold)

						if (RemoveSpacesForMobile == false){
						while (SpacedCharStatus.length < 26) {
							SpacedCharStatus += '\xa0'
						}

						while (SpacedCharName.length < 30) {
							SpacedCharName += '\xa0'
						}

						while (SpacedCharLevel.length < 5) {
							SpacedCharLevel += '\xa0'
						}

						while (SpacedCharXP.length < 4) {
							SpacedCharXP += '\xa0'
						}

						while (SpacedCurrentGP.length < 8) {
							SpacedCurrentGP += '\xa0'
						}

						while (SpacedMaxGP.length < 9) {
							SpacedMaxGP += '\xa0'
						}}
					
					CharInfo.push('\n`' + SpacedCharName + ' - ' + SpacedCharStatus +"`"
            + '\n`LV: ' + SpacedCharLevel
            + ' - XP: ' + SpacedCharXP + ' / 1000'
            + '    - Gold: ' + SpacedCurrentGP + ' / ' + SpacedMaxGP +"`");

				}
					

					QueryPlayerInfo.UntotalXP += CharPulled.ManualXP;
					QueryPlayerInfo.CharacterXP += CharPulled.TotalXP;

				}
				else {CharInfo.push('\nBroken Character Link');}
			}
			
		
			
			)})

			if(AllOwnedCharsNumber != (CharInfo.length+RetiredCharsNumber)){
				CharInfo.push("\nMissing **" + String(AllOwnedCharsNumber - CharInfo.length) +"** characters from the database.")
			}

			QueryPlayerInfo.TotalXP = (QueryPlayerInfo.CharacterXP + QueryPlayerInfo.ReportXP + QueryPlayerInfo.GMXP - QueryPlayerInfo.UntotalXP);
			
			QueryPlayerInfo.CharacterSlots = AutoCalcSlots(QueryPlayerInfo)

			await QueryPlayerInfo.save();

			let StringToEmbed = '\n\n**Characters:**' + CharInfo.slice(0, 6).toString().replace(/,/g, '');

			const PlayerInfoSting = `${PlayerDiscordMention}\n`+bold(
				'Total XP: ' + QueryPlayerInfo.TotalXP
        + ' - Character Slots: ' + (AllOwnedCharsNumber - RetiredCharsNumber) + '/' + QueryPlayerInfo.CharacterSlots
        + '\nCharacter XP: ' + QueryPlayerInfo.CharacterXP
        + ' - Report XP: ' + QueryPlayerInfo.ReportXP
        + ' - GM XP: ' + QueryPlayerInfo.GMXP,
			);


			// unassigned Report Info
			const UnassignedReportInfo = [];
			NumberOfReportsToPull = QueryPlayerInfo.UnassignedReports.length;
			

				const IDtofind = QueryPlayerInfo.UnassignedReports
				
						await ReportData.find({
						'_id': { 
							$in: IDtofind
						}
						}).then((QueryReportInfos) => {
							QueryReportInfos.forEach((QueryReportInfo) => {
								
								if (QueryReportInfo !== null) {
									
									let SpacedReportName = String(QueryReportInfo.Name)
									
									if (RemoveSpacesForMobile == false){
									while (SpacedReportName.length < 60) {
										SpacedReportName += '\xa0'
									}
								}

									UnassignedReportInfo.push('\n`' + SpacedReportName + ' - XP: ' + QueryReportInfo.XP+"`");
								}
								else {
									UnassignedReportInfo.push('\n`***ERR*** - Failed To Find Report: ' + QueryPlayerInfo.UnassignedReports[index]+"`");
								}

							});
						});;

						if (NumberOfReportsToPull != UnassignedReportInfo.length){
							UnassignedReportInfo.push("\n`Missing " + String(NumberOfReportsToPull - UnassignedReportInfo.length) +" unassigned reports from the database.`")
						}
					
					

						function MakeCardsIntoDisplay(QueryPlayerInfo,RemoveSpacesForMobile) {

			let CardCollectionInfo = [];
			NumberOfCardsToProcess = QueryPlayerInfo.CardCollection.length;
			for (let index = 0; index < NumberOfCardsToProcess; index++) {

				const CardtoProcess = QueryPlayerInfo.CardCollection[index];
				if (CardtoProcess !== null && CardtoProcess !== undefined) {

					let SpacedCardTag = CardtoProcess.CardTag
					let SpacedCardName = CardtoProcess.CardName
					let SpacedCardLevel = CardtoProcess.CardLevel
					let SpacedCardQTY = String(CardtoProcess.quantity)

					if (RemoveSpacesForMobile == false) {
						

					while (SpacedCardTag.length < 8) {
						SpacedCardTag += '\xa0'
					}

					while (SpacedCardName.length < 30) {
						SpacedCardName += '\xa0'
					}

					while (SpacedCardLevel.length < 2) {
						SpacedCardLevel += '\xa0'
					}

					while (SpacedCardQTY.length < 3) {
						SpacedCardQTY += '\xa0'
					}

					CardCollectionInfo.push(
						'\n`' + SpacedCardTag + 
						' -  ' + SpacedCardName + 
					' - Lv: '+ SpacedCardLevel + " " + CardtoProcess.CardType +
					' - Qty: ' + SpacedCardQTY+'`');
				} else {

					CardCollectionInfo.push(
						'\n`' + SpacedCardTag + 
						' -  ' + SpacedCardName + 
					'\nLv: '+ SpacedCardLevel + " " + CardtoProcess.CardType +
					' - Qty: ' + SpacedCardQTY+'`');
				}
				}
				else {
					CardCollectionInfo.push('\n***ERR*** - Failed To Find Card: ' + QueryPlayerInfo.CardCollection[index]);
				}

			}
			return CardCollectionInfo
						}
			
			let CardCollectionInfo = MakeCardsIntoDisplay(QueryPlayerInfo,RemoveSpacesForMobile)


			let FooterNoteForIndex = String("Showing " + 0 + "-" + (8) + " of " + CharInfo.length)
			// player info embed
			const InfoPlayerCharEmbed = new EmbedBuilder()
				.setColor(PlayerEmbedColor)
				.setTitle(bold(PlayerName.username))
				.setDescription(PlayerInfoSting + StringToEmbed)
				.setTimestamp()
				.setFooter({ text: FooterNoteForIndex + ' Absalom Living Campaign' });


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

				const rowcard = new ActionRowBuilder()
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
						.setCustomId('reportdesc')
						.setLabel('Unassigned Reports')
						.setStyle(ButtonStyle.Primary),
				);

				const rowcardsort = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('QTtoB')
						.setLabel('Qty Top')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('QBtoT')
						.setLabel('Qty Bot')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('tag')
						.setLabel('Tag')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('CharName')
						.setLabel('Name')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('lvl')
						.setLabel('Level')
						.setStyle(ButtonStyle.Secondary),
				);

			embedMessage = await interaction.editReply({ embeds: [InfoPlayerCharEmbed], components: [rowchar], ephemeral: EphemeralCheck });


			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let currentIndex = 0;
			let MaxIndexDisplay = 8;
			let currentPage = 'charlist';

			collector.on('collect', async interaction => {
				if (interaction.customId === 'charlist') {
					currentIndex = 0;
					MaxIndexLength = CharInfo.length;
					currentPage = interaction.customId;
					rowtodisplay = [rowchar];
					MaxIndexDisplay = 8
					StringToEmbed = '\n\n**Characters:**' + + CharInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
					
				}


				if (interaction.customId === 'reportdesc') {
					currentIndex = 0;
					MaxIndexLength = UnassignedReportInfo.length;
					currentPage = interaction.customId;
					rowtodisplay = [rowreport];
					MaxIndexDisplay = 16
					StringToEmbed = '\n**Unassigned Reports:** ' + UnassignedReportInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();
				}

				if (interaction.customId === 'cardlist') {
					currentIndex = 0;
					MaxIndexLength = CardCollectionInfo.length;
					currentPage = interaction.customId;
					rowtodisplay = [rowcard,rowcardsort]; 

					if (RemoveSpacesForMobile == false) {
						MaxIndexDisplay = 30
					} else {MaxIndexDisplay = 8}


					StringToEmbed =
        '\n**Number of Cards: ' + QueryPlayerInfo.CardNumber + ' - ' + 'Card Rating: ' + QueryPlayerInfo.CardRating + '**' +
		'\n**Unique Cards: ' + QueryPlayerInfo.CardCollection.length + `/${NumberOfUniqueCards}**` +
		'\n**Recycle Points: ' + QueryPlayerInfo.RecycledPoints + '**' +
		'\n**Expedition Tier: ' + QueryPlayerInfo.ExpeditionTier + '**' +
		'\n**Expedition Passes: ' + QueryPlayerInfo.ExpeditionPasses + '**' +
        '\n\n**Card Collection:** ' + CardCollectionInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
					
				}

				{

					// Increase/decrease index
					if (interaction.customId === 'forwardId' && currentIndex + MaxIndexDisplay - MaxIndexLength < 0) {
						currentIndex += MaxIndexDisplay;
					}
					else if (currentIndex - MaxIndexDisplay >= 0 && interaction.customId === 'backId') {currentIndex -= MaxIndexDisplay;}


					if (interaction.customId === 'fowardId' || 'backID') {
						switch (currentPage) {
						case 'charlist':
							StringToEmbed = '\n\n**Characters:**' + CharInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
							rowtodisplay = [rowchar];
							break;


						case 'reportdesc':
							StringToEmbed = '\n**Unassigned Reports:** ' + UnassignedReportInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();
							rowtodisplay = [rowreport];
							break;

						case 'cardlist':
							StringToEmbed =
        '\n**Number of Cards: ' + QueryPlayerInfo.CardNumber + ' - ' + 'Card Rating: ' + QueryPlayerInfo.CardRating + '**' +
		'\n**Unique Cards: ' + QueryPlayerInfo.CardCollection.length + `/${NumberOfUniqueCards}**` +
        '\n**Recycle Points: ' + QueryPlayerInfo.RecycledPoints + '**' +
		'\n**Expedition Tier: ' + QueryPlayerInfo.ExpeditionTier + '**' +
		'\n**Expedition Passes: ' + QueryPlayerInfo.ExpeditionPasses + '**' +
        '\n\n**Card Collection:** ' + CardCollectionInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
							rowtodisplay = [rowcard,rowcardsort]; 
							break;
						}
					}

					if (currentPage == 'cardlist' && (interaction.customId == "QTtoB" 
						|| interaction.customId == "QBtoT"
						|| interaction.customId == "tag"
						|| interaction.customId == "CharName"
						|| interaction.customId == "lvl"
						)){
							QueryPlayerInfo.CardSort = interaction.customId
							QueryPlayerInfo = SortCards(QueryPlayerInfo)
							CardCollectionInfo = MakeCardsIntoDisplay(QueryPlayerInfo,RemoveSpacesForMobile)

							StringToEmbed =
							'\n**Number of Cards: ' + QueryPlayerInfo.CardNumber + ' - ' + 'Card Rating: ' + QueryPlayerInfo.CardRating + '**' +
							'\n**Unique Cards: ' + QueryPlayerInfo.CardCollection.length + `/${NumberOfUniqueCards}**` +
							'\n**Recycle Points: ' + QueryPlayerInfo.RecycledPoints + '**' +
							'\n**Expedition Tier: ' + QueryPlayerInfo.ExpeditionTier + '**' +
							'\n**Expedition Passes: ' + QueryPlayerInfo.ExpeditionPasses + '**' +
							'\n\n**Card Collection:** ' + CardCollectionInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
							rowtodisplay = [rowcard,rowcardsort]; 
						}

					FooterNoteForIndex = String("Showing " + currentIndex + "-" + (MaxIndexDisplay+ currentIndex) + " of " + MaxIndexLength)
					// Respond to interaction by updating message with new embed
					await interaction.update({
						embeds: [new EmbedBuilder()
							.setColor(PlayerEmbedColor)
							.setTitle(bold(PlayerName.username))
							.setDescription(PlayerInfoSting + StringToEmbed)
							.setTimestamp()
							.setFooter({ text: FooterNoteForIndex + ' Absalom Living Campaign' }),
						],

						components: rowtodisplay, ephemeral: EphemeralCheck
					});


				}
			});

		}
		else {
			await interaction.editReply({ content: 'No such player in database or other error.',ephemeral: EphemeralCheck });
		}
	
	
	},
};