const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	ConfirmEmbedColor,
	ReportData,
	PublishSR,
    ConfirmRow,
	
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('publishsessionreport')
    .setDescription('Publishes a report, making it uneditable and hands out the rewards to the listed characters and GMs.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, must be unpublished, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true)),
	async execute(interaction) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

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


		EmbedString = 'Do you wish to publish the SR "**' + ReportName + '**"?';

		let ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });

		let collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':

				let QueryReportInfo = await ReportData.findOne({ Name: ReportName });

				if (QueryReportInfo !== null) {


					if (QueryReportInfo.SSR === true) {
						if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
						else {
							await interaction.update({ content: 'You lack the role(s) to modify this SSR.', embeds: [], components: [] });
							collector.stop();
							break;

						}
					}
					await interaction.deferUpdate();

					EmbedString = await PublishSR(QueryReportInfo, interaction);
					
					await interaction.editReply({ content: EmbedString, embeds: [], components: [] });
					collector.stop();


				}
				else {await interaction.update({ content: 'Report ' + ReportName + ' not found.', embeds: [], components: [] });}


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
        return
        



    }
}