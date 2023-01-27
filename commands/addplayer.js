const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	PlayerData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('addplayer')
    .setDescription('Adds player to database')
    .addUserOption(option => option.setName('mention').setDescription('Player discord @mention').setRequired(true)),
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		var PlayerDiscordMention = interaction.options.getUser('mention');
		var PlayerDiscordID = PlayerDiscordMention.id
		var PlayerDiscordMention = '<@' + PlayerDiscordID + '>'

		try {
			var PlayerName = await client.users.fetch(PlayerDiscordID);
		}
		catch (error) {
			await iinteraction.editReply({ content: 'No such player in database or other error.' });
			return;
		}


		if (typeof PlayerName != undefined) {
			var SameCheck = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });
		}

		var ErrorSend = 'Failed to add player:' + '  -  ' + PlayerDiscordMention;

		try {
			var PlayerDiscordUsername = PlayerName.username;
		}
		catch (err) {

			await interaction.editReply({ content: 'Invalid Name' });
			return;
		}


		if (typeof PlayerDiscordUsername != undefined && typeof PlayerName != undefined && SameCheck == null) {
			item = {
				DiscordId: PlayerDiscordMention,
				Status: 'Active',
				Characters: [], // for holding Name string and database id to link
				UnassignedReports: [], // for holding unassigned GMXP
				TotalXP: 0, // for calcing every single point of assigned xp to characters. Could be useful for doing slot unlocked
				CharacterXP: 0,
				ReportXP: 0,
				GMXP: 0,
				UntotalXP: 0,
				CharacterSlots: 1, // for max allowed characters
				CardCollection: [],
				CardNumber: 0,
				CardRating: 0,
				CardSort: "tag",
				LastPull: new Date(),
				RecycledPoints: 30,
                FirstSR: false,
				EternalCards: 0,

			};

			var data = new PlayerData(item);
			data.save();

			await interaction.editReply({ content: 'Added ' + PlayerDiscordMention + ' Welcome to ALC.' });
		}
		else if (SameCheck != null) {
			ErrorSend += 'Player already exists';
			await interaction.editReply({ content: ErrorSend });
		}
		else if (typeof PlayerDiscordUsername != undefined) {
			await interaction.editReply({ content: ErrorSend });

		}
		return;
        



    }
}