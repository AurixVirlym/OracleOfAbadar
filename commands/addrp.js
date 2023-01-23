const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	PlayerData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('addrp')
    .setDescription('Gives Recycple Points to Everyone.')
    .addNumberOption(option => option.setName('amount').setDescription('The amount of XP to change').setMinValue(0).setMaxValue(100).setRequired(true))
    .addUserOption(option => option.setName('mention').setDescription('A specific person to award RP')),

	async execute(interaction,client) {

        await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		const PlayerDiscordData = interaction.options.getUser('mention');
		let RPtoGive = interaction.options.getNumber('amount')

		if (PlayerDiscordData === null) {
	
			let PlayerListToGiveRP = await PlayerData.find()


			for (const PlayerData of PlayerListToGiveRP) {
			PlayerData.RecycledPoints += RPtoGive
			await PlayerData.save()
			}

			await interaction.editReply({ content: 'Gave everyone **' +  RPtoGive + '** Recycle Points'});
			return
		}

		else {
			let PlayerDiscordID = PlayerDiscordData.id
			PlayerDiscordMention = '<@' + PlayerDiscordID + '>'

			
			if (typeof PlayerDiscordData === undefined) {
				return
			}
			
            let QueryPlayerInfo = await PlayerData.findOne({ DiscordId: PlayerDiscordMention });

			if (QueryPlayerInfo != null) {
				QueryPlayerInfo.RecycledPoints += RPtoGive
				await QueryPlayerInfo.save()
				await interaction.editReply({ content: 'Gave ' + PlayerDiscordMention + " **" + RPtoGive + '** Recycle Points'})
		}

	}
	return



    }
}