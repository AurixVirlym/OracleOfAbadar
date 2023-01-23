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
	.addStringOption(option => option.setName('character').setDescription('Character Name').setMinLength(1).setMaxLength(30).setRequired(true)),

	async execute(interaction) {

		await interaction.deferReply();

		const CharName = interaction.options.getString('character');
		
		if (CharName == null) {
			await iinteraction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		if (typeof CharName === undefined) {
			return;
		}
		const QueryCharacterInfo = await CharacterData.findOne({ Name: CharName });

		if (QueryCharacterInfo != null) {

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

			let StringToEmbed = ''
			let MaxIndexLength = 0;
			let currentIndex = 0;
			let currentPage = 'characterinfo';

			collector.on('collect', async interaction => {

				if (interaction.customId === 'sessionreports') {
					console.log(interaction.customId)
					currentIndex = 0;
					MaxIndexLength = AssignedReportInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = bold('Level: ' + QueryCharacterInfo.Level + ' - XP: ' + QueryCharacterInfo.CurrentXP + '/1000')
            + '\n**Session Reports** ' + AssignedReportInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
			console.log(StringToEmbed)
				}


				if (interaction.customId === 'purchaselog') {
					console.log(interaction.customId)
					currentIndex = 0;
					MaxIndexLength = PurchaseLogInfo.length;
					currentPage = interaction.customId;
					StringToEmbed = '**Gold: ' + CalcedGoldSpent + '/' + QueryCharacterInfo.MaxGold + '**' +
            '\n**Purchase Log:** ' + PurchaseLogInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
			console.log(StringToEmbed)
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

				console.log(interaction.customId)

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
            + '\n**Assigned Reports:**' + AssignedReportInfo.slice(currentIndex, currentIndex + 10).toString().replace(/,/g, '');
							break;
						}
					}

					if (MaxIndexLength > 10) {

						// Respond to interaction by updating message with new embed
						await interaction.update({
							embeds: [new EmbedBuilder()
								.setColor(CharacterEmbedColor)
								.setTitle(bold( QueryCharacterInfo.Name))
								.setDescription(DiscordNameToDisplay +"\n" +StringToEmbed)
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
		return;
	
	
	
	
	},
};

