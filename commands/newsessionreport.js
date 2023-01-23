const { SlashCommandBuilder, Routes } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	RolePlayerGM,
	CollecterTimeout,
	ConfirmEmbedColor,
	PlayerData,
	ReportData,
    ConfirmRow,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('newsessionreport')
    .setDescription('Creates a new report with the given name, name must be unique and a mention of the GM is required.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, must be unique, case sensitive.').setMinLength(1).setMaxLength(60).setRequired(true))
    .addStringOption(option => option.setName('gm').setDescription('Player discord @mention.').setRequired(true)),
	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
		let StringToReply = 'ERR';
		let GMstoReport = [];
		let MakeSSR = false;
		let PlayerDiscordMention = interaction.options.getString('gm');
		let ReportName = interaction.options.getString('reportname');
        let QueryPlayerInfo;

		if (ReportName == null || PlayerDiscordMention == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 60) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}

		PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
		ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');
	    const PlayerDiscordID = PlayerDiscordMention.replace(/[\\<>@#&!]/g, '');


		EmbedString = 'Do you wish to make the SR "**' + ReportName + '**" - ran by "**' + PlayerDiscordMention + '**"?';

		let ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setDescription(EmbedString)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign' });

		let embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		let collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				if (PlayerDiscordMention === '@everyone') {

					if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {

						MakeSSR = true;
						StringToReply = 'Special Session Report ***"' + ReportName + '"*** has been created';
						await PlayerData.find({ Status: 'Active' }).then((PlayerDatas) => {
							PlayerDatas.forEach((PlayerData) => {
								GMstoReport.push(PlayerData._id);

							});
						});

					}
					else {
						interaction.update({ content: 'You lack the role(s) to make a SSR report.', embeds: [], components: [] });
						break;
					}

				}
				else {

					
					let PlayerName = await client.users.fetch(PlayerDiscordID);
					
                    if (typeof PlayerName == undefined) {
                        await interaction.update({ content: 'Incorrect Player Mention', embeds: [], components: [] });
						return
					}

				    QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
					

					if (QueryPlayerInfo === null) {
						await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: [] });
						break;
					}
					GMstoReport = QueryPlayerInfo._id;
					StringToReply = 'Report for ***"' + ReportName + '"*** has been created, ran by ' + PlayerName.username;
				}


				let QueryReportInfo = await ReportData.findOne({ Name: ReportName });
				if (QueryReportInfo === null) {

					item = {
						Name: ReportName,
						RunDate: Date(), // ?
						XP: 250, // default 250 but add option
						Description: 'The Description has not been updated.',
						GMs: GMstoReport, // anyone who gets unassigned xp.
						Characters: [], // id.
						SSR: MakeSSR,
						Published: false, // to determine if the Report should in players hands.
					};

					const data = new ReportData(item);
					await data.save();
					await interaction.update({ content: StringToReply, embeds: [], components: [] });
				}
				else {await interaction.update({ content: 'Name already taken or GM did not have a player profile assigned to them.', embeds: [], components: [] });}

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