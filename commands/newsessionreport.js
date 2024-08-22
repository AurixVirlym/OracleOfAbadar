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
	ReportEmbedColor,
	isValidHttpUrl,
} = require('../constants.js');




module.exports = {
	data: new SlashCommandBuilder().setName('newsessionreport')
    .setDescription('Creates a new report with the given name, name must be unique and a mention of the GM is required.')
    .addStringOption(option => option.setName('reportname').setDescription('Report name, must be unique, case sensitive.').setMinLength(1).setMaxLength(56).setRequired(true))
    .addUserOption(option => option.setName('gm').setDescription('Player discord @mention.').setRequired(true))
	.addStringOption(option => option.setName('reportdescription').setDescription('New report description, must be under 3000 characters.').setMinLength(1).setMaxLength(3000).setRequired(false))
	.addStringOption(option => option.setName('reportimage').setDescription('A URL of a image you wish to use for the report, optional.').setRequired(false))
	.addBooleanOption(option => option.setName('ssr').setDescription('Do you wish to make this an SSR?'))
	,
	
	async execute(interaction,client) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff, RolePlayerGM].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
		let StringToReply = 'ERR';
		let GMstoReport = [];
		let MakeSSR = interaction.options.getBoolean('ssr');
		let PlayerDiscordMention = "<@"+interaction.options.getUser('gm').id+">";
		let ReportName = interaction.options.getString('reportname');
		let ReportImage = interaction.options.getString('reportimage');
		let DescriptionForReport = interaction.options.getString('reportdescription');
        let QueryPlayerInfo;

		if (ReportName == null || PlayerDiscordMention == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (ReportName.length >= 57) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}

		PlayerDiscordMention = PlayerDiscordMention.replace(/!/g, '');
		ReportName = ReportName.replace(/[\\@#&!`*_~<>|]/g, '');
	    const PlayerDiscordID = PlayerDiscordMention.replace(/[\\<>@#&!]/g, '');

		let PlayerName = await client.users.fetch(PlayerDiscordID);

        if (typeof PlayerName == undefined) {
                    await interaction.editReply({ content: 'Incorrect Player Mention', embeds: [], components: [] });
					return
		}

		if (MakeSSR === null){
			MakeSSR = false
		}

		if (DescriptionForReport === null){
			DescriptionForReport = 'The Description has not been updated.';
		}

		


		EmbedString = 'Make SR "**' + ReportName + '**" - by "**' + PlayerName.username + '**"?';

		if (MakeSSR){
			EmbedString = 'Make SSR "**' + ReportName + '**"?';
		}

		let ConfirmEmbed = new EmbedBuilder()
			.setColor(ConfirmEmbedColor)
			.setTitle(EmbedString)
			.setDescription(DescriptionForReport)
			.setTimestamp()
			.setFooter({ text: 'Absalom Living Campaign',iconURL: PlayerName.avatarURL() });

		if (ReportImage !== null){

			if (isValidHttpUrl(ReportImage) === true){
			ConfirmEmbed.setImage(ReportImage)
		} else {
			EmbedString += "\n\nImage URL was not valid."
			ConfirmEmbed.setDescription(EmbedString)
		}
		
		}
		
		let embedMessage = await interaction.editReply({ embeds: [ConfirmEmbed], components: [ConfirmRow] });


		let collector = embedMessage.createMessageComponentCollector({
			filter: ({ user }) => user.id === interaction.user.id, time: CollecterTimeout,
		});

		collector.on('collect', async interaction => {

			switch (interaction.customId) {
			case 'yes':


				if (MakeSSR === true) {

					if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {

						StringToReply = 'Special Session Report ***"' + ReportName + '"*** has been created';
						await PlayerData.find({ Status: 'Active' }).then((PlayerDatas) => {
							PlayerDatas.forEach((PlayerData) => {
								GMstoReport.push(PlayerData._id);

							});
						});

					}
					else {
						MakeSSR = false
						interaction.update({ content: 'You lack the role(s) to make a SSR report.', embeds: [], components: [] });
						break;
					}

				}
				else {


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
						Description: DescriptionForReport,
						GMs: GMstoReport, // anyone who gets unassigned xp.
						Characters: [], // id.
						SSR: MakeSSR,
						Image: ReportImage,
						Published: false, // to determine if the Report should in players hands.
					};

					const data = new ReportData(item);
					await data.save();

					updateembed = new EmbedBuilder()
					.setColor(ReportEmbedColor)
					.setTitle(ReportName)
					.setDescription(DescriptionForReport)
					.setTimestamp()
					.setFooter({ text: 'Absalom Living Campaign',iconURL: PlayerName.avatarURL() });

					if (await isValidHttpUrl(ReportImage)) {
						updateembed.setImage(ReportImage)
						} 

					await interaction.update({ content: StringToReply, embeds: [updateembed], components: [] });
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