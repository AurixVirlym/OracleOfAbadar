const { SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	ReportData,
	isValidHttpUrl,
	ReportEmbedColor,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('changereportdetails')
    .setDescription('Changes a report\'s description or image, must be unpublished.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true))
	.addStringOption(option => option.setName('reportimage').setDescription('A URL of a image you wish to use for the report.').setRequired(false))
    .addStringOption(option => option.setName('reportdescription').setDescription('New report description, must be under 3000 characters.').setMinLength(1).setMaxLength(3000).setRequired(false)),

	async execute(interaction) {

        await interaction.deferReply();
        
        
		if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
		let ReportName = interaction.options.getString('reportname');
		const DescriptionForReport = interaction.options.getString('reportdescription');

		if (ReportName == null) {
			await interaction.editReply({ content: 'No report name was given' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Report name is too long.' });
			return;
		}

		if (DescriptionForReport == null && ReportImage == null) {
			await interaction.editReply({ content: 'A description or image for the report was not given. They are both optional fields in the command.' });
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

			let EmbedString = "Placeholder Text";
			
	

			if (DescriptionForReport !== null){
				QueryReportInfo.Description = DescriptionForReport;
				EmbedString = DescriptionForReport
			}

			const embed = new EmbedBuilder()
				.setColor(ReportEmbedColor)
				.setTitle("Updated Report: " + ReportName)
				.setDescription(EmbedString)
				.setTimestamp()
				.setFooter({ text: 'Absalom Living Campaign' });

			if (typeof ReportImage !== 'undefined'){

			if (isValidHttpUrl(ReportImage) === true){
				QueryReportInfo.Image = ReportImage;
				embed.setImage(ReportImage)
				EmbedString += "\n\nImage updated."
				embed.setDescription(EmbedString)
				} else {
					EmbedString += "\n\nImage URL was not valid."
					embed.setDescription(EmbedString)
				}
				
				}
			
			QueryReportInfo.Description = DescriptionForReport;
			await QueryReportInfo.save();
			await interaction.editReply({ embeds: [embed] });

		}
		else {await interaction.editReply({ content: 'Report ' + ReportName + ' not found.' });}

		return;



    }
}