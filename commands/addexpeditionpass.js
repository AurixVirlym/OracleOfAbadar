const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	RoleBotAdmin,
	PlayerData,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('addexpeditionpass')
    .setDescription('Gives Expedition Passes to Everyone.')
    .addNumberOption(option => option.setName('amount').setDescription('The amount of Passes to give').setMaxValue(5).setRequired(true))
    .addUserOption(option => option.setName('mention').setDescription('A specific person to award EP')),

	async execute(interaction,client) {

        await interaction.deferReply();

		if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}

		const PlayerDiscordData = interaction.options.getUser('mention');
		let EPtoGive = interaction.options.getNumber('amount')

		if (PlayerDiscordData === null) {
	
			let PlayerListToGiveEP = await PlayerData.find()


			for (let PlayerData of PlayerListToGiveEP) {
		
			PlayerData.ExpeditionPasses += EPtoGive
			await PlayerData.save()
			}

			await interaction.editReply({ content: 'Gave everyone **' +  EPtoGive + '** Expedition Passes'});
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
				QueryPlayerInfo.ExpeditionPasses += EPtoGive
				await QueryPlayerInfo.save()
				await interaction.editReply({ content: 'Gave ' + PlayerDiscordMention + " **" + EPtoGive + '** Expedition Passes'})
		}

	}
	return



    }
}