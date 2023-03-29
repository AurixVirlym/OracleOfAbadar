const { SlashCommandBuilder, Routes } = require('discord.js');
const {
	PlayerData,
    RoleBotAdmin,
} = require('../constants.js');



module.exports = {
	data: new SlashCommandBuilder().setName('luckyfix')
    .setDescription('Painpeko, bot admin only'),
    
	async execute(interaction,client) {

        await interaction.deferReply();

        if (interaction.member.roles.cache.some(r => [RoleBotAdmin].includes(r.name))) {}
		else {
			await interaction.editReply({ content: 'You lack the role(s) to use this command.' });
			return;
		}
        
        const EveryPlayer = []

        await PlayerData.find().then((PlayerDatas) => {
			PlayerDatas.forEach((PlayerData) => {
				EveryPlayer.push(PlayerData);
			});
		});

        for (let QueryPlayerInfo of EveryPlayer) {

            QueryPlayerInfo.ExpeditionLucky = 10
            await QueryPlayerInfo.save()
            console.log("Updated: " + QueryPlayerInfo.DiscordId)

        }
        console.log("Done!")


    }
}