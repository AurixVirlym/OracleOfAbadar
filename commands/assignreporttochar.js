const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	CollecterTimeout,
	ConfirmEmbedColor,
	CharacterData,
	PlayerData,
	ReportData,
	CalcGoldFromXP,
	ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('assignreporttochar')
	.setDescription('Gives a you own unassigned report to one of your characters.')
	.addStringOption(option => option.setName('reportname').setDescription('Enter the unassigned report name which you own.').setRequired(true))
	.addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true)),
	async execute(interaction,client) {

        await interaction.deferReply();
        
		var PlayerDiscordID = interaction.user.id;
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
		var CharName = interaction.options.getString('character');
		var ReportName = interaction.options.getString('reportname');
		var StringToReply = '';

		if (ReportName == null || PlayerDiscordMention == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}

		var	ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');


		EmbedString = 'Do you wish to add the unassigned report "**' + ReportName + '**" to **"' + CharName + '**"?';

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


				var PlayerName = await client.users.fetch(PlayerDiscordID);


				if (typeof PlayerName != undefined) {
					var QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					var QueryReportInfo = await ReportData.findOne({ Name: ReportName });
					var QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });

				}
				else {
					await interaction.update({ content: 'Did not find all the database entries. Check for typos.', embeds: [], components: [] });
					break;
				}

				if (QueryPlayerInfo != null && QueryReportInfo !== null && QueryCharInfo != null) {

					if (QueryCharInfo.BelongsTo == QueryPlayerInfo.DiscordId) {
						if (QueryPlayerInfo.UnassignedReports.includes(QueryReportInfo._id) == true) {


							QueryCharInfo.AssignedReports.push(QueryReportInfo._id);
							QueryCharInfo.CurrentXP += QueryReportInfo.XP;
							QueryCharInfo.TotalXP += QueryReportInfo.XP;
							QueryPlayerInfo.ReportXP -= QueryReportInfo.XP;


							StringToReply += '\n***' + QueryCharInfo.Name + '*** gained ' + QueryReportInfo.XP + ' XP!';

							while (QueryCharInfo.CurrentXP >= 1000 && QueryCharInfo.Level < 10) {
								QueryCharInfo.CurrentXP -= 1000;
								QueryCharInfo.Level += 1;
								StringToReply += '\n***' + QueryCharInfo.Name + '*** gained enough XP to gain level ' + QueryCharInfo.Level + '!';
							}

							QueryCharInfo.MaxGold = CalcGoldFromXP(QueryCharInfo);

							await QueryCharInfo.save();
							const index = QueryPlayerInfo.UnassignedReports.indexOf(QueryReportInfo._id);
							if (index > -1) { // only splice array when item is found
								QueryPlayerInfo.UnassignedReports.splice(index, 1); // 2nd parameter means remove one item only
							}


							await QueryPlayerInfo.save();
							StringToReply += '\n***' + QueryReportInfo.Name + '*** has been given to ***' + QueryCharInfo.Name + '!***';
							await interaction.update({ content: StringToReply, embeds: [], components: [] });


						}
						else {await interaction.update({ content: '***' + QueryReportInfo.Name + '*** session report does not belong to you / you already used it.', embeds: [], components: [] });}
					}
					else {await interaction.update({ content: '***' + QueryCharInfo.Name + '*** character does not belong to you.', embeds: [], components: [] });}
				}
				else {await interaction.update({ content: 'Did not find every database entry.', embeds: [], components: [] });}


				collector.stop();

				return;

			case 'no':
				await interaction.update({
					content: 'Cancelled.', embeds: [], components: [],
				});
				collector.stop();
				return;

			}

		});

		return


    }
}