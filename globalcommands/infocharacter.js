const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { bold } = require('discord.js');
const {
	CollecterTimeout,
	CharacterEmbedColor,
	CharacterData,
	ReportData,
	EuroDateFunc,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const isImageURL = require('image-url-validator').default;



module.exports = {
	data: new SlashCommandBuilder().setName('infocharacter')
	.setDescription('Gives information on a given character of a player')
	.addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30))
	.addUserOption(option => option.setName('mention').setDescription('Player Mention'))
	.addBooleanOption(option => option.setName('mobile').setDescription('Do you wish to compress the display? Better for Mobile')),

	async execute(interaction,client,ContextUser,EphemeralCheck) {

		if (EphemeralCheck == null){
			EphemeralCheck = false
		}
	
		await interaction.deferReply( {ephemeral: EphemeralCheck});

		let RemoveSpacesForMobile = interaction.options.getBoolean('mobile');
		const CharName = interaction.options.getString('character');
		const PlayerDiscordData= interaction.options.getUser('mention');

		let PlayerDiscordID, PlayerDiscordMention, PlayerName, PlayerDiscordGiven

		if (ContextUser != null){
			PlayerDiscordID = ContextUser
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			PlayerName = interaction.user
		} else

		if (PlayerDiscordData == null) {
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerDiscordGiven = false
			 PlayerName = interaction.user
		}

		else {
			PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerDiscordGiven = true
			PlayerName = PlayerDiscordData
		}

		if (typeof PlayerName === undefined) {
			await interaction.editReply({ content: 'Discord user not found.' });
			return
		}

		if (RemoveSpacesForMobile == null){
			RemoveSpacesForMobile = false
		}


		async function CreateInfoCharacter(QueryCharacterInfo,MultiChar) {

			const DiscordNameToDisplay = QueryCharacterInfo.BelongsTo
			const CalcedGoldSpent = (QueryCharacterInfo.MaxGold - QueryCharacterInfo.SpentGold).toFixed(2);
			let CharInfoSting = DiscordNameToDisplay + bold('\nLevel: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\nGold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold
            + '\nStatus: ' + QueryCharacterInfo.Status;


			const AssignedReportInfo = [];
			const PurchaseLogInfo = [];
			const ApprovalLogInfo = [];

			let NumberOfReportsToPull = QueryCharacterInfo.AssignedReports.length;
			let NumberOfPurchaseLogs = QueryCharacterInfo.PurchaseLog.length;
			let NumberOfApprovalLogs = QueryCharacterInfo.ApprovalLog.length;

			for (let index = 0; index < NumberOfReportsToPull; index++) {

				const IDtofind = QueryCharacterInfo.AssignedReports[index];


				QueryReportInfo = await ReportData.findOne({ _id: IDtofind });

				if (QueryReportInfo !== null) {

					let SpacedDate =  EuroDateFunc(QueryReportInfo.RunDate)
					let SpacedReport = QueryReportInfo.Name
					let SpacedXP = String(QueryReportInfo.XP)

					if (RemoveSpacesForMobile == false){
						while (SpacedXP.length < 4) {
							SpacedXP += '\xa0'
						}
	
						while (SpacedDate.length < 10) {
							SpacedDate += '\xa0'
						}
	
						while (SpacedReport.length < 46) {
							SpacedReport += '\xa0'
						}
					}

					AssignedReportInfo.push('\n`' + SpacedDate + ' - ' + SpacedReport+ ' - XP: ' + SpacedXP +"`");


				}
				else {
					AssignedReportInfo.push('\n`***ERR*** - Failed To Find Report: ' + QueryCharacterInfo.AssignedReports[index] + '`');
				}

			}

			for (let index = 0; index < NumberOfPurchaseLogs; index++) {

				const Entry = QueryCharacterInfo.PurchaseLog[index];
				
				let SpacedIndex = String(index + ".")
				let SpacedSold = Entry.Sold.toFixed(2)
				let SpacedBrought = Entry.Brought.toFixed(2)
				let SpacedTotal = Entry.Total.toFixed(2)

				if (RemoveSpacesForMobile == false){
					while (SpacedIndex.length < 4) {
						SpacedIndex += '\xa0'
					}

					while (SpacedSold.length < 8) {
						SpacedSold += '\xa0'
					}

					while (SpacedBrought.length < 8) {
						SpacedBrought += '\xa0'
					}

					while (SpacedTotal.length < 8) {
						SpacedTotal += '\xa0'
					}
				}
				

				let MainLine = `${SpacedIndex} ${Entry.Date} - Total: ${SpacedTotal} - Buy: ${SpacedBrought} - Sell: ${SpacedSold}`

				if (RemoveSpacesForMobile == false){
					while (MainLine.length < 66) {
						MainLine += '\xa0'
					}
				}

				MainLine = "\n`" + MainLine + "`" 

				for (let Item of Entry.Items) {
					let SpacedValue = String(-Item.Value)
					let SpacedName = String(Item.Name)

					if (RemoveSpacesForMobile == false){
						while (SpacedName.length < 50) {
							SpacedName += '\xa0'
						}
	
						while (SpacedValue.length < 8) {
							SpacedValue += '\xa0'
						}
					}

					let SecondaryLine = `█ ${SpacedValue} - ${SpacedName}`

					if (RemoveSpacesForMobile == false){
					while (SecondaryLine.length < 66) {
						SecondaryLine += '\xa0'
					}
				}
				SecondaryLine = "\n`"+ SecondaryLine +"`"
					MainLine += SecondaryLine
				}

				PurchaseLogInfo.push(MainLine);


			}

			for (let index = 0; index < NumberOfApprovalLogs; index++) {

				const ApprovalEntry = QueryCharacterInfo.ApprovalLog[index];
				
				let SpacedApproval = String(ApprovalEntry[2])
				let SpacedStaffName = String(ApprovalEntry[3])
				let SpacedDated = String(ApprovalEntry[0])
				let StaffMention = ApprovalEntry[4]
				

				if (RemoveSpacesForMobile == false){
					while (SpacedApproval.length < 62) {
						SpacedApproval += '\xa0'
					}

					while (SpacedStaffName.length < 32) {
						SpacedStaffName += '\xa0'
					}

					while (SpacedDated.length < 10) {
						SpacedDated += '\xa0'
					}
				}

				ApprovalLogInfo.push('\n`'+ `${SpacedDated} - by ${SpacedStaffName}` + "`" + StaffMention
				+'\n`█ ' + SpacedApproval + "`"
				);


			}

			var URLimage = 'https://cdn.discordapp.com/attachments/1006650762035728424/1055186205752434791/Oracle.webp';
			if (await isImageURL(QueryCharacterInfo.CardImage)) {
				var URLimage = QueryCharacterInfo.CardImage;
			}


			// char info embed
			const InfoCharEmbed = new EmbedBuilder()
				.setColor(CharacterEmbedColor)
				.setTitle(bold(QueryCharacterInfo.Name))
				.setDescription(CharInfoSting)
				.setTimestamp()
				.addFields(
					{ name: 'Class', value: QueryCharacterInfo.CardClass, inline: true },
					{ name: 'Type', value: QueryCharacterInfo.CardType, inline: true },
					{ name: 'Fluff Description', value: QueryCharacterInfo.CardDescription },
				)
				.setThumbnail(URLimage)
				.setFooter({ text: 'Absalom Living Campaign' });
			
			if (MultiChar == true){
				InfoCharEmbed.addFields(
					{ name: 'Please ignore "This Interaction Failed."', value: "Everything works. Just give it a second." },
				)
			}


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


			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let FooterNoteForIndex = ''
			let StringToEmbed = ''
			let MaxIndexLength = 0;
			let currentIndex = 0;
			let MaxIndexDisplay = 10
			let currentPage = 'characterinfo';
			let StringApprovalLog, StringPurchaseLog

			collector.on('collect', async interaction => {
				

				if (interaction.customId === 'sessionreports') {
		
					currentIndex = 0;
					MaxIndexLength = AssignedReportInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\n**Session Reports** ' + AssignedReportInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
					MaxIndexDisplay = 16
				}


				if (interaction.customId === 'purchaselog') {

					currentIndex = 0;
					MaxIndexLength = PurchaseLogInfo.length;
					currentPage = interaction.customId;
					MaxIndexDisplay = 10
					StringPurchaseLog = PurchaseLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString()

					while(StringPurchaseLog.length >= 3000){
						MaxIndexDisplay -= 1
					}

					StringPurchaseLog = PurchaseLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString()

					StringToEmbed = '**Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold + '**' +
            '\n**Purchase Log:** ' + StringPurchaseLog
	

				}

				if (interaction.customId === 'approvallog') {
					currentIndex = 0;
					MaxIndexLength = ApprovalLogInfo.length;
					currentPage = interaction.customId;
					MaxIndexDisplay = 10
						
						StringApprovalLog =  ApprovalLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();

						while(StringApprovalLog.length >= 3000){
							MaxIndexDisplay -= 1
							StringApprovalLog =  ApprovalLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();
						}
						
					
						StringToEmbed = '**Approval Log:** ' + StringApprovalLog

					
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
					if (interaction.customId === 'forwardId' && currentIndex + MaxIndexDisplay - MaxIndexLength < 0) 
					{
						currentIndex += MaxIndexDisplay;
					}
					else if (interaction.customId === 'backId') 
					{
						currentIndex -= MaxIndexDisplay;
						if (currentIndex < 0)
						{
							currentIndex = 0
						}
					}
					

					if (interaction.customId === 'fowardId' || 'backID' && interaction.customId !== 'characterinfo') {
						switch (currentPage) {
						case 'purchaselog':
							
						MaxIndexDisplay = 10
						StringPurchaseLog = PurchaseLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString()
	
						while(StringPurchaseLog.length >= 3000){
							MaxIndexDisplay -= 1
							StringPurchaseLog = PurchaseLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString()
						}
	
	
						StringToEmbed = '**Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold + '**' +
				'\n**Purchase Log:** ' + StringPurchaseLog
							break;

						case 'approvallog':
							MaxIndexDisplay = 10
							StringApprovalLog =  ApprovalLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();

						while(StringApprovalLog.length >= 3000){
							MaxIndexDisplay -= 1
							StringApprovalLog =  ApprovalLogInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString();
						}
						
					
						StringToEmbed = '**Approval Log:** ' + StringApprovalLog
							
							break;

						case 'reportdesc':
							MaxIndexDisplay = 16
							StringToEmbed = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\n**Assigned Reports:**' + AssignedReportInfo.slice(currentIndex, currentIndex + MaxIndexDisplay).toString().replace(/,/g, '');
							break;
						}
					}


					FooterNoteForIndex = String("Showing " + currentIndex + "-" + (MaxIndexDisplay+ currentIndex) + " of " + MaxIndexLength)

					if (MaxIndexLength > MaxIndexDisplay || currentIndex > 0) {

						// Respond to interaction by updating message with new embed
						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold( QueryCharacterInfo.Name))
								.setDescription(DiscordNameToDisplay +"\n" +StringToEmbed)
								.setTimestamp()
								.setFooter({ text: FooterNoteForIndex + 'Absalom Living Campaign' }),
							],

							components: [rowinfochar, rowindex],
						});
					}
					else if (interaction.customId === 'characterinfo') {

						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold(QueryCharacterInfo.Name))
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
								.setTitle(bold(QueryCharacterInfo.Name))
								.setDescription(DiscordNameToDisplay +"\n" +StringToEmbed)
								.setTimestamp()
								.setFooter({ text: FooterNoteForIndex + 'Absalom Living Campaign' }),
							],

							components: [rowinfochar],


						});
					}

				}
			});
		}

		let QueryCharactersInfo;
		
		if (CharName == null) {
			QueryCharactersInfo = await CharacterData.find({ BelongsTo: PlayerDiscordMention });
		} else if (PlayerDiscordGiven == true){
			QueryCharactersInfo = await CharacterData.find({ Name: { "$regex": CharName, "$options": "i" }, BelongsTo: PlayerDiscordMention });
		} else if (CharName.length >= 2) {
			QueryCharactersInfo = await CharacterData.find({ Name: { "$regex": CharName, "$options": "i" } });
		} else {
			await interaction.editReply({ content: 'No such character in database or other error. If using partial search, use at least two letters or add player mention.' })
			return 
		}
		
		if (QueryCharactersInfo != null && QueryCharactersInfo.length > 1){
			let MultipleCharacterString =""

			const rowcharacterselect1 = new ActionRowBuilder()
			const rowcharacterselect2 = new ActionRowBuilder()
			
			for (let index = 0; index < QueryCharactersInfo.length; index++) {
				const Character = QueryCharactersInfo[index];
				MultipleCharacterString += index + ". " + Character.BelongsTo + " - " + Character.Name +"\n"

				if (index < 5){
					rowcharacterselect1.addComponents(
						new ButtonBuilder()
							.setCustomId(String(index))
							.setLabel(String(index) + ". " + Character.Name)
							.setStyle(ButtonStyle.Primary))
				} else {

				 rowcharacterselect2.addComponents(
					new ButtonBuilder()
						.setCustomId(String(index))
						.setLabel(String(index) + ". " + Character.Name)
						.setStyle(ButtonStyle.Primary))
					}

				if (index >= 9){
					MultipleCharacterString += "...and so on. Narrow down your search."
					break
				}
			}
			let rowscharacterselect ;
			if (QueryCharactersInfo.length > 5 ){
				rowscharacterselect = [rowcharacterselect1,rowcharacterselect2]
			} else {
				rowscharacterselect = [rowcharacterselect1]
			}
		

			
			const MutlipleCharEmbed = new EmbedBuilder()
				.setColor(CharacterEmbedColor)
				.setTitle(bold(QueryCharactersInfo.length + " Characters Have Been Found."))
				.setDescription(MultipleCharacterString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			embedMessage = await interaction.editReply({ embeds: [MutlipleCharEmbed], components: rowscharacterselect });

			let Multicollector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

	

			Multicollector.on('collect', async interaction => {
				
				CreateInfoCharacter(QueryCharactersInfo[interaction.customId],true)
				QueryCharactersInfo = null
				Multicollector.stop();

			}
			)
		}


		else if (QueryCharactersInfo != null && QueryCharactersInfo.length == 1) {
			CreateInfoCharacter(QueryCharactersInfo[0],false)
	}
		else {
			await interaction.editReply({ content: 'No such character in database or other error.' });
		}
		return;
	
	
	
	
	},
};

