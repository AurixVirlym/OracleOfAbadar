const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	RoleStaff,
	CharacterData,
	RecalcCharacter,

} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('addxp')
    .setDescription('Adds/Subtracts XP to a character, it is not counted in the player xp total.')
    .addStringOption(option => option.setName('character').setDescription('Character Name.').setMinLength(1).setMaxLength(32).setRequired(true))
    .addNumberOption(option => option.setName('xp').setDescription('The amount of XP to change.').setMinValue(-1000).setMaxValue(1000).setRequired(true))
	.addUserOption(option => option.setName('mention').setDescription('Player discord @mention.')),
	async execute(interaction) {

        await interaction.deferReply();
        
        if (interaction.member.roles.cache.some(r => [RoleBotAdmin, RoleStaff].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		let CharName = interaction.options.getString('character');
		let XPtoAdd = Math.round(interaction.options.getNumber('xp'));

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


		if (CharName == null || XPtoAdd == null) {
			await interaction.editReply({ content: 'Not all inputs given.' });
            console.log("check")
			return;
		}
		else if (CharName.length > 32) {
			await interaction.editReply({ content: 'Name is too long.' });
            console.log("length")
			return;
		}


		if (typeof CharName === undefined) {

            return;
		}

        const QueryCharInfo = await CharacterData.findOne({ Name: CharName, BelongsTo: PlayerDiscordMention });

		if (QueryCharInfo != null) {
			QueryCharInfo.ManualXP += XPtoAdd;
            console.log("BOOP")
			await QueryCharInfo.save();
			RecalcCharacter(CharName, interaction, PlayerDiscordMention);
		}
		else {
			await interaction.editReply({ content: 'Did not find the character.' });
		}


		return;



    }
}