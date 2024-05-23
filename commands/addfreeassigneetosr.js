const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	ConfirmEmbedColor,
    ConfirmRow,
	FreeAssigneeAddToReport,
} = require('../constants.js');


module.exports = {
	data: new SlashCommandBuilder().setName('addfreeassigneetosr')
    .setDescription('Adds a player as a free assignee to an unpublished report, up to 8 at a time.')
    .addStringOption(option => option.setName('reportname').setDescription('Exact report name you wish to add the characters to, must be unpublished.').setMinLength(1).setMaxLength(60).setRequired(true))
    .addUserOption(option => option.setName('player-1').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-2').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-3').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-4').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-5').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-6').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-7').setDescription('Mention of the player you wish to add to the report.'))
    .addUserOption(option => option.setName('player-8').setDescription('Mention of the player you wish to add to the report.')),

	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		var GMsFromMessage = [
			interaction.options.getUser('player-1'),
			interaction.options.getUser('player-2'),
			interaction.options.getUser('player-3'),
			interaction.options.getUser('player-4'),
			interaction.options.getUser('player-5'),
			interaction.options.getUser('player-6'),
			interaction.options.getUser('player-7'),
			interaction.options.getUser('player-8'),
		];


		var ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}

		if (GMsFromMessage.every(element => element === null)) {
			await interaction.editReply({ content: 'No gms given.' });
			return;
		}


		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		for (iterator of GMsFromMessage) {
			if (iterator !== null) {
				iterator = "<@" + iterator.id +">";
			
			}
		}

		EmbedString = 'Do you wish to add the following players as free assignees to SR "**' + ReportName + '**"?\n' + GMsFromMessage;

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


				FreeAssigneeAddToReport(GMsFromMessage, ReportName, interaction);
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

		return;



    }
}