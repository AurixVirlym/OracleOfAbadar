const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RecalcCharacter,
} = require('../constants.js');


module.exports = {
	data: new SlashCommandBuilder().setName('recalculatecharacter')
    .setDescription('Forces a recalculation of a characters reports.')
    .addStringOption(option => option.setName('character').setDescription('Character Name, case sensitive.').setMinLength(1).setMaxLength(30).setRequired(true))
	.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.')),

	async execute(interaction) {

        await interaction.deferReply();

		let PlayerDiscordData= interaction.options.getUser('mention');

		let PlayerDiscordID, PlayerDiscordMention, PlayerName

		if (PlayerDiscordData == null) {
			 PlayerDiscordID = interaction.user.id;
			 PlayerDiscordMention = '<@' + PlayerDiscordID + '>';
			 PlayerName = interaction.user
		}

		else {
			PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'
			PlayerName = PlayerDiscordData
		}

		if (typeof PlayerName === undefined) {
			return
		}
        
		var CharName = interaction.options.getString('character');

		if (CharName == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
			return;
		}
		else if (CharName.length >= 31) {
			await interaction.editReply({ content: 'Name is too long.' });
			return;
		}


		if (typeof CharName != undefined) {

			RecalcCharacter(CharName, interaction,PlayerDiscordMention);
		}
		else {
			await interaction.editReply({ content: 'Did not find the character.' });
		}
		return;



    }
}