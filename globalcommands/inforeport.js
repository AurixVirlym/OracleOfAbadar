const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ReportEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
} = require('../constants.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bold } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder().setName('inforeport')
    .setDescription('gives information on a given report.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true)),

	async execute(interaction,client) {

        await interaction.deferReply();
        let ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}


		ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		const QueryReportInfo = await ReportData.findOne({ Name: ReportName });

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

            let SRtitle;

			if (typeof FirstGMName != undefined && FirstGMName != null) {
				SRtitle = QueryReportInfo.Name + ' - Ran by ' + FirstGMName;
			}
			else if (QueryReportInfo.SSR === true) {
				SRtitle = QueryReportInfo.Name + ' - Special Session Report.';
			}
			else {
				SRtitle = QueryReportInfo.Name;
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

			let embedMessage = await interaction.editReply({ embeds: [embed], components: [rowdesc] });
			let currentPage = 'reportdesc';

			let collector = embedMessage.createMessageComponentCollector({
				filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
			});

			let currentIndex = 0;
			collector.on('collect', async interaction => {

               let CharInReportID, CharInReportDisplay, GMsInReportID, GMsInReportDisplay

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
        return



    }
}