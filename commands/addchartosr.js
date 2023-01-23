const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	ConfirmEmbedColor,
	CharsAddToReport,
    ConfirmRow,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('addchartosr')
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

	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		const CharsFromMessage = [
			interaction.options.getString('character-1'),
			interaction.options.getString('character-2'),
			interaction.options.getString('character-3'),
			interaction.options.getString('character-4'),
			interaction.options.getString('character-5'),
			interaction.options.getString('character-6'),
			interaction.options.getString('character-7'),
			interaction.options.getString('character-8'),
		];


		let ReportName = interaction.options.getString('reportname');

		if (ReportName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}

		if (CharsFromMessage.every(element => element === null)) {
			await interaction.editReply({ content: 'No characters given.' });
			return;
		}


		ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');


		EmbedString = 'Do you wish to add the following characters to SR "**' + ReportName + '**"?\n' + CharsFromMessage;

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

        return
        
    }
}