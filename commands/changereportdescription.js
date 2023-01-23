const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	ReportData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('changereportdescription')
    .setDescription('Changes a report\'s description, must be unpublished.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true))
    .addStringOption(option => option.setName('reportdescription').setDescription('New report description, must be under 3000 characters.').setMinLength(1).setMaxLength(3000).setRequired(true)),

	async execute(interaction) {

        await interaction.deferReply();
        
        
		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
		let ReportName = interaction.options.getString('reportname');
		const DescriptionForReport = interaction.options.getString('reportdescription');

		if (ReportName == null || DescriptionForReport == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Report name is too long.' });
			return;
		}


		ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');

		let QueryReportInfo = await ReportData.findOne({ Name: ReportName });

		if (QueryReportInfo !== null) {
			if (QueryReportInfo.SSR === true) {
				if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
				else {
					interaction.editReply({ content: 'You lack the role(s) to modify this SSR.' });
					return;
				}
			}

			QueryReportInfo.Description = DescriptionForReport;
			await QueryReportInfo.save();
			await interaction.editReply({ content: 'Description for report ***' + ReportName + '*** has been updated.' });

		}
		else {await interaction.editReply({ content: 'Report ' + ReportName + ' not found.' });}

		return;



    }
}